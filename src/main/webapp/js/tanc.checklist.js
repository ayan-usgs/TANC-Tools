TANC.checklist = (function() {
	var _checklistAnswers = {"1":{},"2":{},"3":{},"4":{}, "5":{}};
	var _hasAnswers = false;
	var _content;
	var _radios;
	var _panelOpen;
	var _currentMapProperty;
	var _titleArray= [
	    "Get Started", 
	    "Source of Water", 
	    "Geochemical Conditions", 
	    "Groundwater Age Mixture", 
	    "Preferential Flow Pathways"];

	var _map = {
		"get_started_checklist" : {
			fileName : "get_started.json",
			titleIndex : 0
		},
		"source_recharge_checklist" : {
			fileName : "source_recharge_checklist.json",
			titleIndex : 1
		},
		"geochemical_checklist" : {
			fileName : "geochemical_checklist.json",
			titleIndex : 2
		},
		"gw_age_checklist" : {
			fileName : "gw_age_checklist.json",
			titleIndex : 3
		},
		"pref_flow_path_checklist" : {
			fileName : "pref_flow_path_checklist.json",
			titleIndex : 4
		}
	};
	
	var _this = {
			hasAnswers : false
	};
	
	var _storeButtonAnswer = function(id, parent) {
		var newAnswer = id.replace(parent.id + "_", "");
		var alteredParentId = parent.id.replace(/_/g, ".");
		var checklistNumber = parent.id.substring(0,1);
		var oldAnswer = _checklistAnswers[checklistNumber][alteredParentId];
		
		if(oldAnswer && newAnswer != oldAnswer) {
			_content.jstree("close_all", "#" + parent.id + "_" + oldAnswer, true);
			$("#" + parent.id + "_" + oldAnswer)
			.children("a")
			.css("color", "black");
		}
		
		
		_checklistAnswers[checklistNumber][alteredParentId] = newAnswer;
		_this.hasAnswers = true;
	};
	
	var _removeOldChildAnswers = function(id, parent) {
		var alteredParentId = parent.id.replace(/_/g, ".");
		var checklistNumber = parent.id.substring(0,1);
		var parentIdTokens = parent.id.split("_");
		$.each(_checklistAnswers[checklistNumber], function(k,v) {
			var shouldDelete = ($.string(k).include(alteredParentId) &&
				k != alteredParentId &&
				k.substring(0, alteredParentId.length) == alteredParentId);
			if(shouldDelete) {
				var deleteId = k.replace(/[.]/g, "_");
				
				//for textareas and textfields
				var textId = "#" + deleteId + "_response";
				var textElts = $(textId);
				if(textElts && textElts.length > 0) {
					textElts[0].value = "";
				} else {
					deleteId += "_" + v;
					$("#" + deleteId)
					.children("a")
					.css("color", "black");
				}
				
				delete _checklistAnswers[checklistNumber][k];
			}
		});
	}; 
	
	var _handleTreeNodeSelect = function(e, data) {
		//auto expand child questions
		var obj = data.rslt.obj;
		var node = data.inst;
		var id = obj.attr("id");
		var type = obj.attr("node-type");
		
		if(!id || id == "") return;
		
		_content.jstree("toggle_node", "#" + id);
		
		// handle answers
		var parent = node._get_parent(obj)[0];
		if(type == "option") {
			if(!node.is_closed(obj)) {
	    		$(obj.context).css("color", "red");
				_storeButtonAnswer(id, parent);
	    		_removeOldChildAnswers(id, parent);
				if(!node.is_leaf(obj)) {
		    		 
		    		// expand grandchildren if there are any
		    		var children = node._get_children(obj);
		    		if(children) {
		    			$.each(children, function(index, value) {
			    			node.open_node(value);
		    			});
		    		}
				}
			} else {
				_removeCurrentAnswer(id);
				$(obj.context).css("color", "black");
			}
		}
		//avoid attempt to find text if we are at the "Entire Checklist" (contains "root" sections).
		if (id.indexOf('root') < 1) {
			_fillPreviousAnswer(id, node);
		}
	};
	
	var _fillPreviousAnswer = function(id, node) {
		//replace _ with .
		var alteredId = id.replace(/_/g, ".");
		//get the text out of the Answer store
		var text = _checklistAnswers[alteredId.charAt(0)][alteredId];
		//if there is an answer, attempt to handle the different controls
		if (text) {
			var textId = "#" + id + "_response";
			var textElts = $(textId);
			//handle empty text boxes
			if(textElts && textElts.length > 0 && (!textElts[0].value || textElts[0].value == '')) {
				textElts[0].value = text;
			} else {
				var radioFound = _fillRadioAnswer(text);
				//if not text or a radio, it must be a button
				if (!radioFound){
					_fillButtonAnswer(id, node, text);
				}
			}
		}
	};
	
	var _fillRadioAnswer = function(text){
		var radioFound = false;
		//attempt to handle radios
		if (radios) {
			radios.each(function(index, value) {
				if (value.value == text){
					radioFound = true;
					value.checked = true;
				}else {
					value.checked = false;
				}
			});
		}
		return radioFound;
	};
	
	var _fillButtonAnswer =  function(id, node, text){
		var textId = id + "_" + text;
		var button = $("#" + textId);
		//set the selected button css to the selected color "red"
		button.children("a").css("color", "red");
		//spin through the button's list items (conditional follow up questions) ...
		if (button.children("ul") && button.children("ul").children("li")){
			$.each( button.children("ul").children("li"), function(index, value) {
				//...and open the nodes & fill in values recursively.
				node.open_node(value);
				_fillPreviousAnswer(value.id, node);
			});
		}
	};
	
	
	var _removeCurrentAnswer = function(id) {
		var alteredId = id.replace(/_/g, ".");
		var tokens = alteredId.split(".");
		var answer = tokens.pop();
		alteredId = alteredId.replace("." + answer, "");
		if(_checklistAnswers[alteredId.charAt(0)][alteredId] == answer) {
			delete _checklistAnswers[alteredId.charAt(0)][alteredId];
		}
	};
	
	var _handleTextChange = function(event, data) {
		var inputElt = event.currentTarget,
			id = inputElt.id,
			value = inputElt.value,
			parentId = id.replace("_response", "").replace(/_/g, ".");
			_checklistAnswers[parentId.substring(0,1)][parentId] = value;
			_this.hasAnswers = true;
	};
	
	var _handleRadioSelect = function(event) {
		event.preventDefault();
		var target = event.currentTarget,
			id = target.id.substring(0, target.id.length-2).replace(/_/g, ".");
		radios.each(function(index, value) {
			value.checked = (value == event.currentTarget);
		});
		_checklistAnswers[id.substring(0,1)][id] = target.value;
		_this.hasAnswers = true;
	};
	
	var _buildTree = function(json, title) {
		// create tree and bind to click event
		_content = _content || $("#mainbody");
		_content.jstree({
			core : { html_titles : true },
			"json_data" : json,
	        "plugins" : [ "json_data", "ui" ]
		})
		.bind("load_node.jstree", function(e, data) {
			// add title
			var _title = (title || json.title);
			_content.children("ul:first-child").before("<h1>" + _title + "</h1>").css("padding-left", "20px");
			_content.children("h1").css("padding-left", "20px");
			_makeButtons();
			
			var children = _content.children();
			var textfields = children.find("input:text");
			var textareas = children.find("textarea");
			textfields.add(textareas)
			.keyup(function(e, data) {
				_handleTextChange(e, data);
			});
			radios = $(":radio");
			radios.change(_handleRadioSelect);
		})
		.bind("select_node.jstree", function (e, data) {
			_handleTreeNodeSelect(e, data);
	    });
	};
	
	var _makeWholeChecklist = function() {		
		var checklistJson = { "data" : [] };
		var cache = TANC.json.cache;
		$.each(_titleArray, function(index, value) {
			// make a deep copy of the json in the cache
			var newJson = $.extend(true, {}, cache[value]);
			newJson.children = newJson.data;
			newJson.data = newJson.title;
			newJson.attr = {};
			newJson.attr.id = index + "_root";
			delete newJson.title;
			checklistJson.data.push(newJson);
		});
		_buildTree(checklistJson, "Entire Checklist");
	};
	
	var _linkChecklist = function(node) {
		$("#" + node.id).click(function(e) {
			e.preventDefault();
			if(node.id == "complete-checklist") {
				_makeWholeChecklist();
			} else {
				_currentMapProperty = node.id;
				TANC.json.currentName = _titleArray[_map[_currentMapProperty].titleIndex];
				var cache = TANC.json.cache[TANC.json.currentName];
				_buildTree(cache);
			}
			if(!_panelOpen) {
				$("#tab").click();
				_panelOpen = true;
			}
		});
	};
	
	var _makeButtons = function(title) {
		// add title
//		_content.children("ul:first-child").before("<h1>" + title + "</h1>").css("padding-left", "20px");
//		_content.children("h1").css("padding-left", "20px");
		
		// add button images to anchors and override styling
		$("li[node-type='option'] > a").button()
		.css("padding", 0)
		.find("span")
		.css({
			padding: 0,
			"font-weight": "normal",
			"font-size": "1em"
		})
		.find("ins")
		.css({
			width: 0,
			height: 0
		});
	};
	
	var _openPanel = function(){ //adding a toggle function to the #tab
		$('#checklist-pane').width("37%");
		$('#content-pane').width("53%");
		$('#panel').stop().animate({width:"37%", opacity:1}, 500, function() {//sliding the #panel to 31%
			$('.content').fadeIn('slow'); //slides the content into view.
		});
		_panelOpen = true;
	};
	
	var _closePanel = function() { //when the #tab is next clicked
	   $('.content').fadeOut('slow', function() { //fade out the content
		   $('#checklist-pane').width("0%");
		   $('#content-pane').width("85%");
		   $('#panel').stop().animate({width:"0", opacity:1}, 500); //slide the #panel back to a width of 0
	   });
	   _panelOpen = false;
	};
	
	var _initPanel = function() {	
		_panelOpen = false;
		$('#tab').toggle(_openPanel, _closePanel);
		TANC.json.initJson(_map, _titleArray);
	};
	
	var _getAnswers = function() {
		return $.toJSON(_checklistAnswers);
	};
	
	var _getReport = function(data) {
		var element = data.element;
		var type = data.type;
		if(_this.hasAnswers) {
			var answers = _getAnswers();
			if(type == "html") {
				element.load("report/html", { json : answers }, function(response, status, xhr) {
					if (status == "error") {
						var msg = "Sorry but there was an error ";
						element.html(msg + xhr.status + " : " + xhr.responseText);
					} else {
						var button = $("<button type='button'>Download PDF Report</button>");
						element.append(button);
						button.click({ element : element, type : "pdf" }, _handleClickDownloadEvent);
						element.children().find("a")
						.each(function(index, element) {
							var i = index;
							$(element).click(function(event, data) {
								data.callback(this.id);
							});
						});				
					}
				});
			} else if(type == 'pdf') {
				$.download('report/pdf', "json=" + answers);
			}
		}
	};
	
	var _handleClickDownloadEvent = function(e) {
		_getReport(e.data);
	};
	
	_this.linkChecklist = _linkChecklist
	_this.initPanel = _initPanel;
	_this.getAnswers = _getAnswers;
	_this.hasAnswers = _hasAnswers;
	_this.getReport = _getReport;
	
	return _this;
})();