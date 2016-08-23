//=============================================================================
// Mount Blade Battle System Engine Plugins - Elastically Scroll
// MBBS_ElasticallyScroll.js
//=============================================================================
/*:
 * @plugindesc v1.0 MBBS Plugins: MBBS_ElasticallyScroll
 * @author Chivalry Studio Plugins / Ivan


*/
var Imported = Imported || {};
Imported.MBBS_ElasticallyScroll = true;

var MBBS_MV = MBBS_MV || {};
MBBS_MV.ElasticallyScroll = MBBS_MV.MBBS_ElasticallyScroll || {};


//=============================================================================
// Game_Player
//=============================================================================
Game_Player.prototype.updateScroll = function(lastScrolledX, lastScrolledY) {
    var x1 = lastScrolledX;
    var y1 = lastScrolledY;
    var x2 = this.scrolledX();
    var y2 = this.scrolledY();
    // if (y2 > y1 && y2 > this.centerY()) {
    //     $gameMap.scrollDown(y2 - y1);
    // }
    // if (x2 < x1 && x2 < this.centerX()) {
    //     $gameMap.scrollLeft(x1 - x2);
    // }
    // if (x2 > x1 && x2 > this.centerX()) {
    //     $gameMap.scrollRight(x2 - x1);
    // }
    // if (y2 < y1 && y2 < this.centerY()) {
    //     $gameMap.scrollUp(y1 - y2);
    // }
    if (y2 > y1 && y2 - $gameMap.displayY() > this.centerY()){
      $gameMap.scrollDown(y2 - y1);
    }
    if (x2 < x1 && x2 - $gameMap.displayX() < this.centerX()){
      $gameMap.scrollLeft(x1 - x2)
    }
    if (x2 > x1 && x2 - $gameMap.displayX() > this.centerX()){
      $gameMap.scrollRight(x2 - x1)
    }
    if (y2 < y1 && y2 - $gameMap.displayY() < this.centerY()){
      $gameMap.scrollUp(y1 - y2)
    }

  var halfWidth  = Graphics.boxWidth  / 2; //320
  var halfHeight = Graphics.boxHeight / 2; //240
  var areaWidth  = Graphics.boxWidth  / 2;//128
  var halfGrid   = 16;//$gameMap.tileWidth()/2.0;

  //console.log($gameMap.displayX()+" "+$gameMap.displayY());

    if (y2 - $gameMap.displayY() > 15*areaWidth - halfHeight*4){
      $gameMap.scrollDown(y2 > $gameMap.height()*areaWidth - halfHeight*4 ? 
        (($gameMap.height() - 15)*areaWidth - $gameMap.displayY())/halfGrid :
        ((y2 - $gameMap.displayY() - 15*areaWidth + halfHeight*4)/halfGrid));
    }
    if (x2 - $gameMap.displayX() < halfWidth*4){
      $gameMap.scrollLeft(x2 < halfWidth*4 ? $gameMap.displayX()/halfGrid :
        (($gameMap.displayX() + halfWidth*4 - x2)/halfGrid));
    }
    if (x2 - $gameMap.displayX() > 20*areaWidth - halfWidth*4){
      $gameMap.scrollRight(x2 > $gameMap.width()*areaWidth - halfWidth*4  ?
        (($gameMap.width() - 20)*areaWidth - $gameMap.displayX())/halfGrid :
        (x2 - $gameMap.displayX() - 20*areaWidth + halfWidth*4 )/halfGrid)
    }
    if (y2 - $gameMap.displayY() < halfHeight*4){
        $gameMap.scrollUp(y2 < halfHeight*4 ?  $gameMap.displayY()/halfGrid : 
      (($gameMap.displayY()+halfHeight*4-y2)/halfGrid))
    }



};




/*
  #--------------------------------------------------------------------------
  # ● 弹性滚动英雄
  #-------------------------------------------------------------------------- 
  def elastically_scroll




  end




*/





//=============================================================================
// End of File
//=============================================================================