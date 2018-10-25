function CurrentPage ()
{
    var me = this;

    me.blnOverrides = {'OverridenDomains' : null,
			 'OverridenPages' : null,
			 'NotOverridenPages' : null,
			 'NotOverridenDomains' : null,
			 'OverrideAll': null
			}
    me.Overrides = {'OverridenDomains' : new Array(), 
		      'OverridenPages' : new Array(), 
		      'NotOverridenPages' : new Array(), 
		      'NotOverridenDomains' : new Array(), 
		      'OverrideAll' : null
		     }

    me.Url;
    me.Domain;
    me.CurrentTabId;

    me.getOverrides = function (){
	me.Overrides['OverridenDomains'] = JSON.parse(localStorage["OverridenDomains"]);
	me.Overrides['OverridenPages'] = JSON.parse(localStorage["OverridenPages"]);
	me.Overrides['NotOverridenDomains'] = JSON.parse(localStorage["NotOverridenDomains"]);
	me.Overrides['NotOverridenPages'] = JSON.parse(localStorage["NotOverridenPages"]);
	me.Overrides['OverrideAll'] = JSON.parse(localStorage["OverrideAll"]);
    }

    me.callInjectCss = function (){	
	chrome.tabs.sendRequest(me.CurrentTabId, {action: "injectCss", css: me.CssToInject} , null);
	me.displayOverriden(me.CurrentTabId);
    }

    me.callRemoveCss = function (){
	chrome.tabs.sendRequest(me.CurrentTabId, {action: "removeCss"}, null);
    }

    me.setIsOverridenOrNot =  function (path, overrideType){
	me.blnOverrides[overrideType] = me.Overrides[overrideType].indexOf(path) != -1;
    }

    me.manageOverride = function (overrideType, blnValue, localStorageValue, action, CSSfn){
	switch(action){
	case 'add':
	    me.Overrides[overrideType].push(localStorageValue);
	    break;
	case 'remove':
	    me.Overrides[overrideType].splice(me.Overrides[overrideType].indexOf(localStorageValue),1);
	    break;
	case 'set':
	    me.Overrides[overrideType] = localStorageValue;
	    break;
	}
	localStorage[overrideType]  = JSON.stringify(me.Overrides[overrideType]);
	me.blnOverrides[overrideType] = blnValue;
	CSSfn();
    }

    me.isStyleOverriden = function(){
	me.setIsOverridenOrNot(me.Url, 'NotOverridenPages');
	me.setIsOverridenOrNot(me.Domain, 'NotOverridenDomains');
	me.setIsOverridenOrNot(me.Url, 'OverridenPages');
	me.setIsOverridenOrNot(me.Domain, 'OverridenDomains');
	me.blnOverrides['OverrideAll'] = loadOption('OverrideAll');
	return (me.blnOverrides['OverrideAll'] && !(me.blnOverrides['NotOverridenPages'] || me.blnOverrides['NotOverridenDomains'])) || me.blnOverrides['OverridenPages'] || me.blnOverrides['OverridenDomains'];
    }

    me.setDefaults = function(){
	setDefaultOption("OverridenDomains", new Array());
	setDefaultOption("OverridenPages", new Array());
	setDefaultOption("NotOverridenDomains", new Array());
	setDefaultOption("NotOverridenPages", new Array());
	setDefaultOption("CustomFonts", new Array());
	setDefaultOption("OverrideAll", false);
	setDefaultOption("IsNotFirstStart", true);
	setDefaultOption("DefaultBrowserFont", true);
	setDefaultOption("DefaultBrowserColor", false);
	setDefaultOption("text_color", "E8E8E8");
	setDefaultOption("background_color", "080808");
	setDefaultOption("links_color", "2E79DB");
	setDefaultOption("visited_links_color", "9B51DB");
	setDefaultOption("FontSize", "0");
	setDefaultOption("ShowImage", true);
	setDefaultOption("ShowFlash", true);
	setDefaultOption("OverrideFontName", "Arial");
    }

    me.updatePageAction = function(tabId){
	chrome.tabs.get(tabId, function (tab){
	    me.CurrentTabId = tabId;
	    me.Url = tab.url;
	    me.Domain = extractDomain(tab.url);
	    if(me.isStyleOverriden()){
		me.callInjectCss();
		me.displayOverriden(tabId);
	    }
	       else
		   me.displayDefault(tabId);

	       chrome.browserAction.show(tabId);
	});

    }

    me.displayDefault = function(tabId){
	chrome.browserAction.setIcon({tabId: tabId, path: "icons/colors_icons_grey.png"});
    }


    me.displayOverriden = function(tabId){
	chrome.browserAction.setIcon({tabId: tabId, path: "icons/colors_icons.png"});
    }


    me.buildCssToInject = function(){
	var backgroundColor = '#' + loadOption("background_color");
	var textColor = '#' + loadOption("text_color");
	var linksColor = '#' + loadOption("links_color");
	var visitedLinksColor = '#' + loadOption("visited_links_color");
	var fontName = loadOption("OverrideFontName");
	var fontSize = parseInt(loadOption("FontSize"));
	var defaultBrowserFont = loadOption("DefaultBrowserFont");
	var defaultBrowserColor = loadOption("DefaultBrowserColor");
	var showImages = loadOption("ShowImage");
	var showFlash = loadOption("ShowFlash");

	if(defaultBrowserColor != true){
	    var css =  'html > body, html > body * {' + 
		'background-color: '+ backgroundColor +' !important;' +
		'color: ' + textColor + ' !important;' + 
		'text-shadow: 0 !important;' +
		'-webkit-text-fill-color: none !important;}' +
		'html > body, html > body *:not([onclick]):not(:link):not(:visited) {' +
		'background-image: none !important;}' +
		'html > body a:link, html > body a:link *,' +
		'html > body a:link:hover, html > body a:link:hover *,' +
		'html > body a:link:active, html > body a:link:active * {' +
		'color: ' + linksColor + ' !important;}' +
		'html > body a:visited, html > body a:visited *,' +
		'html > body a:visited:hover, html > body a:visited:hover *,' +
		'html > body a:visited:active, html > body a:visited:active * {' +
		'color:' +  visitedLinksColor + ' !important;}';
	}
	if(defaultBrowserFont != true){
	    css += 'html > body, html > body * {' +
		'line-height: normal !important;' +
		'font-family: '+ fontName  +' !important;';
	    if(fontSize != 0){
		css += 'font-size: '+ fontSize +'pt !important;}';
	    }
	    else{
		css += '}'
	    }
	}
	if(!showImages) {
	    css += 'html > body img { display:none !important; }';
	}
	if(!showFlash){
	    css += 'html > body object { display:none !important;}';
	}
	me.CssToInject = css;
    }

    me.setDefaults();
    me.getOverrides();
    me.buildCssToInject();
}

function extractDomain(url){
    return url.match(/:\/\/(.+?)\//)[1];
}

function loadOption(optionName){
    return JSON.parse(localStorage[optionName]);   
}

function saveOption(optionName, optionValue){
    localStorage[optionName]  = JSON.stringify(optionValue);    
}

function setDefaultOption(optionName, value){
    if(localStorage[optionName] == undefined){
	saveOption(optionName, value);
    }
}

var objCurrentPage = new CurrentPage;

chrome.tabs.onSelectionChanged.addListener(objCurrentPage.updatePageAction);
chrome.tabs.onUpdated.addListener(objCurrentPage.updatePageAction);


chrome.extension.onRequest.addListener(
  function(request, sender, sendResponse) {
      switch(request.shortCut){
      case "overridePage":
	  if(objCurrentPage.blnOverrides['OverridenPages'])
	      objCurrentPage.manageOverride('OverridenPages', false, objCurrentPage.Url, 'remove', objCurrentPage.callRemoveCss);
	  else
	      objCurrentPage.manageOverride('OverridenPages', true, objCurrentPage.Url, 'add', objCurrentPage.callInjectCss);
	  break;
      case "overrideDomain":
	  if(objCurrentPage.blnOverrides['OverridenDomains'])
	      objCurrentPage.manageOverride('OverridenDomains', false, objCurrentPage.Domain, 'remove', objCurrentPage.callRemoveCss);
	  else
	      objCurrentPage.manageOverride('OverridenDomains', true, objCurrentPage.Domain, 'add', objCurrentPage.callInjectCss);
	  break;
      case "overrideAll":
	  if(objCurrentPage.blnOverrides['OverrideAll'])
	      objCurrentPage.manageOverride('OverrideAll', false, false, 'set', objCurrentPage.callRemoveCss);
	  else
	      objCurrentPage.manageOverride('OverrideAll', true, true, 'set', objCurrentPage.callInjectCss);
	  break;
      }
  }
);