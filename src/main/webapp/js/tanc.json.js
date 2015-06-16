TANC.json = (function() {
	var _jsonCache = {};
	var _transformedCache = {};
	var _this = {
			currentName : null
	};

	var _transformJson = function(json) {
		var number = Object.keys(json)[0];
		
		// convert json format
		_transformedCache[_this.currentName] = {
				"title" : number + ". " + _this.currentName,
				"data" : []
		};
		$.each(json[number], function(key, value) {
			_transformedCache[_this.currentName].data.push(_parseNode(key, value));
		});
	};

	var _initJson = function(map, titles) {
		$.each(map, function(index, value) {
			var title = titles[value.titleIndex];
			if(!_transformedCache[title]) {
				$.getJSON("json/" + value.fileName, function(json) {
					_this.currentName = title;
					_transformJson(json);
				});
			}
		});
	};
	
	var _parseChild = function(nodeType, hasChildren, object, id, prefix) {
		var node = {
			"attr" : { "id" : id, "node-type" : nodeType },
			"data" : "<span class='question-prefix' >" + prefix + "</span> " + object[nodeType]
		};
		
		if(hasChildren) {
			var prefix, suffix;
			if(nodeType == 'text-question') {
				prefix = "input";
				suffix = "type='text'";
			} else if(nodeType == 'list-question') {
				prefix = "textarea";
				suffix = "cols='15' rows='3'";
			}
			node.children = [{ "data" : "<" + prefix + " id='" + id + "_response' " + suffix + " />" }];
		}
		
		return node;
	};

	var _parseTextQuestion = _parseChild.bind(this, 'text-question', true);
	var _parseListQuestion = _parseChild.bind(this, 'list-question', true);
	var _parseAnswer = _parseChild.bind(this, 'answer', false);
	var _parseLink = _parseChild.bind(this, 'link-text', false);
	
	var _parseQuestion = function(object, id, prefix) {
		var newObj = _parseChild('question', false, object, id, prefix);
		var children = [];
		$.each(object, function(key, value) {
			if(key == "answers") {
				$.each(value, function(k, v) {
					children.push({
						"attr" : { "id" : id + "_option_" + k, "node-type" : "list-option" },
						"data" : "<input type='radio' id='" + id + "_" + k + "' value='" + k + "'/>" + v + "<br/>"
					});
				});
			} else if(!$.string(key).include("question")) {
				var tokens = key.split(" ");
				var childId = tokens.shift();
				$.each(tokens, function(index, value) {
					childId += "_" + value;
				});
				var child = {
					"attr" : { "id" :  id + "_" + childId.toLowerCase(), "node-type" : "option" },
					"data" : key
				};
				child.children = [];
				$.each(value, function(k, v) {
					if(k != "response") child.children.push(_parseNode(k, v));
				});
				children.push(child);
			}
		});
		newObj.children = children;
		return newObj;
	};

	var _parseNode = function(key, obj) {
		var newObj;
		var tokens = key.split('.');
		var id = tokens.shift();
		$.each(tokens, function(index, value){
			id += "_" + value;
		});
		if(obj.response) alert("RESPONSE!!!")
		newObj = obj.question ? _parseQuestion(obj, id, key) :
			obj.answer ? _parseAnswer(obj, id, key) :
			obj["text-question"] ? _parseTextQuestion(obj, id, key) :
			obj["list-question"] ? _parseListQuestion(obj, id, key) :
			obj["link-text"] ? _parseLink(obj, id, key) : 
			obj.response ? null : null;
		return newObj;
	};
	
	_this.transformJson = _transformJson;
	_this.initJson = _initJson;
	_this.cache = _transformedCache;
	return _this;
})();