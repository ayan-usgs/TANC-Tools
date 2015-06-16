/*
Author: Zach Dwiel

Flot plugin for adding point dragging capabilities to a plot.

Heavy inspiration from Chris Leonello.  Thank you!

Example usage:

  plot = $.plot(...);
  
Options:

  // to set the draggable properties of all series:
  grid, xaxis, yaxis : {
    draggable: boolean
  }
  
  // to set the draggable properties of a single series:
  // can also be set in the data series rather than the options, see example
  series : {
    draggable : boolean,
    draggablex : boolean,
    draggabley : boolean
  }
  
  // series specifc options over-ride 'global' options
*/


// dependencies: jquery.event.drag.js, we put them inline here to save people 
// the effort of downloading them.

/*
jquery.event.drag.js ~ v1.5 ~ Copyright (c) 2008, Three Dub Media (http://threedubmedia.com)  
Licensed under the MIT License ~ http://threedubmedia.googlecode.com/files/MIT-LICENSE.txt
*/
(function(E){E.fn.drag=function(L,K,J){if(K){this.bind("dragstart",L)}if(J){this.bind("dragend",J)}return !L?this.trigger("drag"):this.bind("drag",K?K:L)};var A=E.event,B=A.special,F=B.drag={not:":input",distance:0,which:1,dragging:false,setup:function(J){J=E.extend({distance:F.distance,which:F.which,not:F.not},J||{});J.distance=I(J.distance);A.add(this,"mousedown",H,J);if(this.attachEvent){this.attachEvent("ondragstart",D)}},teardown:function(){A.remove(this,"mousedown",H);if(this===F.dragging){F.dragging=F.proxy=false}G(this,true);if(this.detachEvent){this.detachEvent("ondragstart",D)}}};B.dragstart=B.dragend={setup:function(){},teardown:function(){}};function H(L){var K=this,J,M=L.data||{};if(M.elem){K=L.dragTarget=M.elem;L.dragProxy=F.proxy||K;L.cursorOffsetX=M.pageX-M.left;L.cursorOffsetY=M.pageY-M.top;L.offsetX=L.pageX-L.cursorOffsetX;L.offsetY=L.pageY-L.cursorOffsetY}else{if(F.dragging||(M.which>0&&L.which!=M.which)||E(L.target).is(M.not)){return }}switch(L.type){case"mousedown":E.extend(M,E(K).offset(),{elem:K,target:L.target,pageX:L.pageX,pageY:L.pageY});A.add(document,"mousemove mouseup",H,M);G(K,false);F.dragging=null;return false;case !F.dragging&&"mousemove":if(I(L.pageX-M.pageX)+I(L.pageY-M.pageY)<M.distance){break}L.target=M.target;J=C(L,"dragstart",K);if(J!==false){F.dragging=K;F.proxy=L.dragProxy=E(J||K)[0]}case"mousemove":if(F.dragging){J=C(L,"drag",K);if(B.drop){B.drop.allowed=(J!==false);B.drop.handler(L)}if(J!==false){break}L.type="mouseup"}case"mouseup":A.remove(document,"mousemove mouseup",H);if(F.dragging){if(B.drop){B.drop.handler(L)}C(L,"dragend",K)}G(K,true);F.dragging=F.proxy=M.elem=false;break}return true}function C(M,K,L){M.type=K;var J=E.event.handle.call(L,M);return J===false?false:J||M.result}function I(J){return Math.pow(J,2)}function D(){return(F.dragging===false)}function G(K,J){if(!K){return }K.unselectable=J?"off":"on";K.onselectstart=function(){return J};if(K.style){K.style.MozUserSelect=J?"":"none"}}})(jQuery);

(function ($) {
    var options = {
            xaxis: {
                draggable: false,
            }, yaxis: {
                draggable: false,
            }, grid: {
                draggable: false,
            }
        },
        drag = { pos: { x:null, y:null}, active: false };

    function init(plot) {
        function bindEvents(plot, eventHolder) {
            var o = plot.getOptions();
            var i;
            var series_draggable = false;
            var series = plot.getData();
            for (i = 0; i < series.length; ++i) {
              if(series[i].draggable || series[i].draggablex || series[i].draggabley) {
                series_draggable = true;
              }
            }
            if (o.grid.draggable || o.xaxis.draggable || o.yaxis.draggable || series_draggable) {
                eventHolder.bind("dragstart", { distance: 10 }, function (e) {
                    if (e.which != 1)  // only accept left-click
                        return false;
                    var plotOffset = plot.getPlotOffset();
                    var offset = eventHolder.offset(),
                        pos = { pageX: e.pageX, pageY: e.pageY },
                        canvasX = e.pageX - offset.left - plotOffset.left,
                        canvasY = e.pageY - offset.top - plotOffset.top;
                    drag.gridOffset = {top: offset.top + plotOffset.top, left: offset.left + plotOffset.left};
 
                    drag.item = plot.findNearbyItem(canvasX, canvasY, function (s) { return s["draggable"] != false; });
 
                    if (drag.item) {
                        drag.item.pageX = parseInt(drag.item.series.xaxis.p2c(drag.item.datapoint[0]) + offset.left + plotOffset.left);
                        drag.item.pageY = parseInt(drag.item.series.yaxis.p2c(drag.item.datapoint[1]) + offset.top + plotOffset.top);
                        drag.active = true;
                    }
                });
                eventHolder.bind("drag", function (pos) {
                    var axes = plot.getAxes();
                    var ax = axes.xaxis;
                    var ay = axes.yaxis;
                    var ax2 = axes.x2axis;
                    var ay2 = axes.y2axis;
                    var sidx = drag.item.seriesIndex;
                    var didx = drag.item.dataIndex;
                    var s = plot.getData()[sidx];
        
                    if (drag.item.series.yaxis == ay2)
                        ay = ay2;
                    if (drag.item.series.xaxis == ax2)
                        ax = ax2;
        
                    var newx = ax.min + (pos.pageX-drag.gridOffset.left)/ax.scale;
                    var newy = ay.max - (pos.pageY-drag.gridOffset.top)/ay.scale;
        
//                     // this version will change the data itself rather than 
//                     // the points and then reprocess all the data and redraw.
//                     // NOTE: reuqires exposing plot.processData as a public
//                     // function in jquery.flot.js
//                     series[sidx].data[didx] = [newx, newy];
//                     plot.processData();

                    // change the raw data instead of processing every point all over again, not as clean, but faster
                    var points = s.datapoints.points;
                    var ps = s.datapoints.pointsize;
                    if((o.grid.draggable || o.xaxis.draggable || s.draggablex || s.draggable) && (s.draggablex != false)) {
                      points[didx*ps] = newx;
                    }
                    if((o.grid.draggable || o.yaxis.draggable || s.draggabley || s.draggable) && (s.draggabley != false)) {
                      points[didx*ps+1] = newy;
                    }
        
                    plot.draw();
        
                    var retx = points[didx*ps];
                    var rety = points[didx*ps+1];
                    
                    // uncomment if you are using Jonathan Leto's log plugin
//                     var yaxisBase = o.yaxis.base;
//                     var xaxisBase = o.xaxis.base;
//                     if (s.yaxis == axes.y2axis)
//                         yaxisBase = o.y2axis.base;
//                     if (s.xaxis == axes.x2axis)
//                         xaxisBase = o.x2axis.base;
//         
//                     if ( yaxisBase > 1 ) {
//                         rety = Math.exp(newy*Math.LN10);
//                     }
//         
//                     if ( xaxisBase > 1 ) {
//                         retx = Math.exp(newx*Math.LN10);
//                     }
                    
                    plot.getPlaceholder().trigger('plotSeriesChange', [sidx, didx, retx, rety])
                });
                eventHolder.bind("dragend", function (e) {
                    var sidx = drag.item.seriesIndex;
                    var didx = drag.item.dataIndex;
                    var s = plot.getData()[sidx];
                    var ps = s.datapoints.pointsize;
                    plot.getPlaceholder().trigger('plotFinalSeriesChange', [sidx, didx, s.datapoints.points[didx*ps], s.datapoints.points[didx*ps+1]])
                });
            }
        }

        plot.hooks.bindEvents.push(bindEvents);
    }
    
    $.plot.plugins.push({
        init: init,
        options: options,
        name: 'draggable',
        version: '1.0'
    });
})(jQuery);
