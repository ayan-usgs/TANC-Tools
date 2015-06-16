(function () {
    $(document).ready(function () {

    	function isPrintablePage() {
    		var isPP = false
    		
    		try {
	    		if ( window.location.href.indexOf('?')>0 ) {
	    			isPP = true
	    		}
    		} catch (e){} // prevent any parsing to cause page failure    			
    		
    		return isPP
    	}    	
    	
        function closeGuide(dialog) {
            var box = dialog.parent()
        
            var css = $(box).offset()
            css.width = $(box).width()
            css.height = $(box).height()
            css.position = 'absolute'
            css['z-index'] = 9999
            css.border = '5px solid gold'

            $(dialog).dialog('close')
            
            var cfg = {
                opacity: 0.25,
                top: $('#guide').offset().top,
                left: $('#guide').offset().left,
                height: $('#guide').height(),
                width: $('#guide').width()
              }

            $('<div/>',{id:'dialogghost'}).css(css).animate(cfg,1500,function(){
                $('#dialogghost').remove()
                $('#guide').css({color:'gold'})
            }).appendTo('body')
        }
        
        window.showGuide = function() {
	        var dialog = $('#splashContent').dialog({
	            modal: true,
	            width: 500,
	            dialogClass: 'agemix-modal',
	            closeOnEscape: false,
	            buttons: {
	                "OK" : function(){
	                    closeGuide(dialog)
	                },
	                "Do not display this message in the future" : function(){
	                    $.cookie('hideAgeMixSplash', 'true');
	                    closeGuide(dialog)	                        
	                }
	            }
	        });
	        return false;
        }
        if ( ! isPrintablePage() && 'true' !== $.cookie('hideAgeMixSplash') ) {
            window.showGuide()
        }
    });
}());
        