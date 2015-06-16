TANC = (function() {
	var glossary;
	var mainbody;
	var loaded = false;
	
	var _linkMap = {
		"home" : "home.html",
		"age_mixture2" : "predict-age_mixture2.html",
		"age_mixture3" : "predict-age_mixture3.html",
		"age_mixture4" : "predict-age_mixture4.html",
		"contact-email" : null,
		"cs-age_mix_1" : "case_studies/cs-age_mix_1.html",
		"cs-geochemical_1" : "case_studies/cs-geochemical_1.html",
		"cs-geochemical_2" : "case_studies/cs-geochemical_2.html",
		"cs-pref_flow_1" : "case_studies/cs-pref_flow_1.html",
		"cs-recharge_1" : "case_studies/cs-recharge_1.html",
		"cs-recharge_2" : "case_studies/cs-recharge_2.html",
		"intro-how_to" : "intro-how_to.html",
		"intro-key_findings" : "intro-key_findings.html",
		"predict-age_mixture" : "predict-age_mixture.html",
		"predict-combined_intro" : "predict-combined_intro.html",
		"predict-combined_nitrate": "predict-combined_nitrate.html",
		"predict-combined_voc": "predict-combined_voc.html",
		"predict-geochemical" : "predict-geochemical.html",
		"predict-intro" : "predict-intro.html",
		"predict-pref_flow" : "predict-pref_flow.html",
		"predict-pref_flow2" : "pref_flow_types.html",
		"pref_flow_types" : "pref_flow_types.html",
		"pref_flow_importance" : "pref_flow_importance.html",
		"pref_flow_implications" : "pref_flow_implications.html",
		"predict-pref_flow3" : "predict-pref_flow3.html",
		"predict-recharge" : "predict-recharge.html",
		"references" : "references.html",
		"study_area_california" : "study_areas/study_area_california.html",
		"study_area_connecticut" : "study_areas/study_area_connecticut.html",
		"study_area_florida" : "study_areas/study_area_florida.html",
		"study_area_nebraska" : "study_areas/study_area_nebraska.html",
		"toolbox-geochemical" : "toolboxes/toolbox-geochemical.html",
		"toolbox-geochemical2" : "toolboxes/toolbox-geochemical2.html",
		"toolbox-gw_age_1" : "toolboxes/toolbox-gw_age_1.html",
		"toolbox-gw_age_2" : "toolboxes/toolbox-gw_age_2.html",
		"toolbox-gw_age_3" : "toolboxes/toolbox-gw_age_3.html",
		"toolbox-gw_age_4" : "toolboxes/toolbox-gw_age_4.html",
		"toolbox-gw_age_5" : "toolboxes/toolbox-gw_age_5.html",
		"toolbox-gw_age_6" : "toolboxes/toolbox-gw_age_6.html", 
		"toolbox-gw_age_mix" : "toolboxes/ageMixTool.html",
		"toolbox-miscellaneous_1" : "toolboxes/toolbox-miscellaneous_1.html",
		"toolbox-miscellaneous_2" : "toolboxes/toolbox-miscellaneous_2.html",
		"toolbox-pf-zot" : "toolboxes/toolbox-pf-zot.html",
		"toolbox-pf_inf_pw" : "toolboxes/toolbox-pf_inf_pw.html",
		"toolbox-recharge_depth_int" : "toolboxes/toolbox-recharge_depth_int.html",
		"toolbox-recharge_mixing_equations" : "toolboxes/toolbox-recharge_mixing_equations.html",
		"toolbox-rv_1" : "toolboxes/toolbox-rv_1.html",
		"toolbox-rv_2" : "toolboxes/toolbox-rv_2.html",
		"toolbox_intro" : "toolboxes/toolbox_intro.html",
	};
	
	function _insertFragmentUrl(linkId) {
		linkId = parseDomXss(linkId);
		if (linkId !== "noAction") {
			window.location.hash = '#'+linkId.substring(1);
			loaded = false;
		}
	}
	
	function doInsertFragment() {
		var linkId = parseDomXss( window.location.hash ).substring(1);
		if ( ! isDefined(linkId) || linkId.length===0 ) {
			linkId = "home"
		}
		_removeLeftBar()  // remove when not needed and prevent multiple
		if (linkId === "home") {
			_insertLeftBar()
		}
		if (linkId == "glossary") {
			mainbody.html(glossary);
			loaded = glossary !== undefined
		} else {
			mainbody.load("ajax/" + _linkMap[linkId]+"?_="+Date.now(), function(response, status, xhr) {
				if (status == "error") {
					_insertFragmentUrl("_")
					doInsertFragment()
	//				var msg = "Sorry but there was an error ";
	//				mainbody.html(msg + xhr.status + " : " + xhr.responseText);
					return;
				}
				loaded = true;
				var links = mainbody.find("a");
				links.each(function(index, element) {
					var i = index;
					$(element).click(function(event, data) {
						if(this.id == "") {
							return;
						}
						_insertFragmentUrl(this.id);
					});
				});
			});
		}
	};
	
	function _initializeMenu() {
		$("#MenuBar1 a[id]").each(function(index, element) {
			if($.string(element.id).include("checklist")) {
				TANC.checklist.linkChecklist(element);
			} else if(element.id == "report"){
				$(element).click(function(e) {
					TANC.checklist.getReport({ element : mainbody, type : "html", callback : _insertFragmentUrl});
				});
			} else {
				$(element).click(function(e) {
					e.preventDefault();
					_insertFragmentUrl(element.id); 
				});
			}
		});
	};
	
	function _insertLeftBar() {
		if ( $("#lefttable").length == 0 ) {
			$.get("ajax/left-bar.html", function(data, textStatus, xhr) {
				if ( $("#lefttable").length == 0 ) {
					mainbody.before(data);
				}
			}, "html");
		}
	};
	
	function _removeLeftBar() {
		while ( $("#lefttable").length !== 0 ) {
			$("#lefttable").remove()
		}
	}
		
	function _fillGlossary() {
		$.getJSON("json/glossary.json", function(json) {
			glossary = '<h1>Glossary</h1><dl id="glossary-list">';
			$.each(json, function(term, definition) {
				glossary += "<dt>" + term + "</dt><dd>" + definition + "</dd>";
			});
			glossary += "</dl>";
		});
	};
	
	function listenToHash() {
		// Default to the current location.
		var strLocation = window.location.href;
		var strHash = parseDomXss( window.location.hash ).substring(1);
		var strPrevLocation = "";
		var strPrevHash = "";

		// This is how often we will be checkint for
		// changes on the location.
		var intIntervalTime = 200;

		// This will be the method that we use to check
		// changes in the window location.
		var fnCheckLocation = function() {
			strLocation = window.location.href;
			strHash = parseDomXss( window.location.hash ).substring(1);
			
			// Check to see if the location has changed.
			if (strPrevHash != strHash || !loaded) {

				// Store the new and previous locations.
				strPrevLocation = strLocation;
				strPrevHash = strHash;
				doInsertFragment()

			}
		}
		

		// Set an interval to check the location changes.
		setInterval( fnCheckLocation, intIntervalTime );
	}	
	
	return {
		initPage : function() {
			mainbody = $("#mainbody");
			_initializeMenu();
			_fillGlossary();
			doInsertFragment();
			listenToHash()
		},
		insertFragment : _insertFragmentUrl
	};
})();

$(function() {
	TANC.initPage();
	TANC.checklist.initPanel();
});



