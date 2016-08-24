//=============================================================================
// Game Map Main Game - Main Game Core Engine
// Game_CoreSystem.js
//=============================================================================

var Imported = Imported || {};
Imported.Game_CoreSystem = true;
var Game_CoreSystem = Game_CoreSystem || {};
Game_CoreSystem.Core = Game_CoreSystem.Core || {};
//=============================================================================
// Core Game Global Constants
//=============================================================================

//=============================================================================
//DataManager
//=============================================================================
var $dataObjectTiles        = null;
DataManager._databaseFiles.push({ name: '$dataObjectTiles', src: 'Game_ObjectTilesets.json' });

//=============================================================================
// Game_Object
//=============================================================================
function Game_Object() {
    this.initialize.apply(this, arguments);
}
Game_Object.prototype.initialize = function(objectId,x,y) {
    var data = $dataObjectTiles[objectId];
    this._characterName = data.characterName;
    
    this._opacity = 255;
    this._x = x; 
    this._y = y - 1; 
    this._width = data.width;
    this._height = data.height;

    this._passableGrids = data.passableGrids; //the size of this array should be width*height (in 32)
                              //and it should store data like 0101, 1111, 1010 binary numbers
        // need to be fix

    this._blendMode = 0;
    this._through = false;

    this._areaRect = new Rectangle(this._x,this._y,this._width-1,this._height*2/3);


};
Game_Object.prototype.characterName = function() {
    return this._characterName;
};

Game_Object.prototype.indexToMapIndex = function(index){
    var x = this._x + index % this._width;
    var y = this._y + index / this._width;
    y = ~~y;
    return x+ y*$dataMap.width;
};

Game_Object.prototype.screenX = function() {
    var tw = $gameMap.tileWidth();
    return Math.round(this.scrolledX() * tw + tw / 2);
};

Game_Object.prototype.screenY = function() {
    var th = $gameMap.tileHeight();
    return Math.round(this.scrolledY() * th + th);
};

Game_Object.prototype.opacity = function() {
    return this._opacity;
};
    /*
     * Z coordinate:
     *
     * 0 : Lower tiles
     * 1 : Lower characters
     * 3 : Normal characters
     * 4 : Upper tiles
     * 5 : Upper characters
     * 6 : Airship shadow
     * 7 : Balloon
     * 8 : Animation
     * 9 : Destination
     */
Game_Object.prototype.scrolledX = function() {
    //var shifter = this._width % 2 === 0 ? 0.5 : 1;
    return $gameMap.adjustX(this._x - 0.5);
};

Game_Object.prototype.scrolledY = function() {
    return $gameMap.adjustY(this._y);
};

Game_Object.prototype.update = function() {
    //main update
    this.updateOpcaity();
    //console.log(this._opacity);

};
Game_Object.prototype.updateOpcaity = function() {
    if (this._areaRect.contains($gamePlayer.x,$gamePlayer.y)) {
        this._opacity = 175;
    }else{
        this._opacity = 255;
    }
};
//=============================================================================
// Game_Map
//=============================================================================
Game_CoreSystem.Core.Game_Map_initialize = Game_Map.prototype.initialize;
Game_Map.prototype.initialize = function() {
    this._objects = [];
    Game_CoreSystem.Core.Game_Map_initialize.call(this);
    
}    
Game_CoreSystem.Core.Game_Map_setup = Game_Map.prototype.setup;
Game_Map.prototype.setup = function(mapId) {
    Game_CoreSystem.Core.Game_Map_setup.call(this,mapId);
    
    this._objectsLayer = new Array(this.width()*this.height());
    for (var i = this._objectsLayer.length - 1; i >= 0; i--) {
        this._objectsLayer[i] = 15;
    }

    this.setupObjects();
    this.setupObjectsLayer();
};
Game_Map.prototype.objects = function() {
    return this._objects.filter(function(obj) {
        return !!obj;
    });
};
Game_Map.prototype.setupObjects = function() {
    this._objects = [];
    var self = this;
    this.events().forEach(function(event) {
        event.refresh();
        if (!event.page()) {
            return;
        }
        if (event.list()[0].code !== 108) {
            return;
        } 
        if (event.list()[0].parameters[0] === "Object") {
            if (event.list()[1].code !== 408) {
                return;
            }
            var pattern = /\d+/;
            var objID =    Number(event.list()[1].parameters[0].match(pattern));
            self._objects.push(new Game_Object(objID,event.x,event.y));
            event.erase();
        };
        
    });
};
Game_Map.prototype.setupObjectsLayer = function() {
    var self = this;
    this._objects.forEach(function(object) {
        for (var i = 0; i < object._passableGrids.length; i++) {
            self._objectsLayer[object.indexToMapIndex(i)] &= object._passableGrids[i];

        }
    });

    
};

Game_CoreSystem.Core.Game_Map_isPassable = Game_Map.prototype.isPassable;
Game_Map.prototype.isPassable = function(x, y, d) {
    var width = $dataMap.width;
    return this.checkObjectPassage(x,y,d) && 
        Game_CoreSystem.Core.Game_Map_isPassable.call(this,x, y, d);
};
Game_Map.prototype.checkObjectPassage = function(x,y,d) {
    var width = $dataMap.width;
    return this._objectsLayer[x+width*y] & (1 << (d / 2 - 1)) ;
};

Game_CoreSystem.Core.Game_Map_update = Game_Map.prototype.update;
Game_Map.prototype.update = function(sceneActive) {
    Game_CoreSystem.Core.Game_Map_update.call(this,sceneActive);
    this.updateObjects();
};

Game_Map.prototype.updateObjects = function() {
    this.objects().forEach(function(obj) {
        obj.update();
    });
};

//-----------------------------------------------------------------------------
// Sprite_Object
//---------------------------------------------------------------------------- 
function Sprite_Object() {
    this.initialize.apply(this, arguments);
}

Sprite_Object.prototype = Object.create(Sprite_Base.prototype);
Sprite_Object.prototype.constructor = Sprite_Object;

Sprite_Object.prototype.initialize = function(object,isUpperLayer) {
    Sprite_Base.prototype.initialize.call(this);
    this.initMembers();
    this.setObject(object);
    this._isUpperLayer = isUpperLayer;
};
Sprite_Object.prototype.initMembers = function() {
    this._object = null;
};
Sprite_Object.prototype.setObject = function(object) {
    this._object = object;
};
Sprite_Object.prototype.update = function() {
    Sprite_Base.prototype.update.call(this);
    this.updateBitmap();
    this.updateFrame();
    this.updatePosition();
    this.updateOpcaity();
    
};
Sprite_Object.prototype.updateBitmap = function() {
    if (this.isImageChanged()) {
        this._characterName = this._object.characterName();
        this.setCharacterBitmap();
    }
};
Sprite_Object.prototype.isImageChanged = function() {
    return ( this._characterName !== this._object.characterName());
};
Sprite_Object.prototype.setCharacterBitmap = function() {
    this.bitmap = ImageManager.loadCharacter(this._characterName);
};
Sprite_Object.prototype.updateFrame = function() {
    this.updateCharacterFrame();
};
Sprite_Object.prototype.updateCharacterFrame = function() {
    var pw = this.patternWidth();
    var ph = this.patternHeight();
    var sy = this._isUpperLayer ? ph : 0;
    this.setFrame(0, sy, pw, ph);
};
Sprite_Object.prototype.patternWidth = function() {
    return this.bitmap.width;
};
Sprite_Object.prototype.patternHeight = function() {
    return this.bitmap.height / 2;
};
Sprite_Object.prototype.updatePosition = function() {
    this.x = this._object.screenX();
    this.y = this._object.screenY();
    this.z = this._isUpperLayer ? 4 : 1;
};
Sprite_Object.prototype.updateOpcaity = function() {
    this.opacity = this._object.opacity();
};
//=============================================================================
// Spriteset_Map
//=============================================================================
Game_CoreSystem.Core.Spriteset_Map_createLowerLayer = Spriteset_Map.prototype.createLowerLayer;
Spriteset_Map.prototype.createLowerLayer = function(){
    Game_CoreSystem.Core.Spriteset_Map_createLowerLayer.call(this);
    this.createObjects();
};
Spriteset_Map.prototype.createObjects = function() {
    this._objectLowerLayerSprites = [];
    this._objectUpperLayerSprites = [];

    $gameMap.objects().forEach(function(obj) {
        this._objectLowerLayerSprites.push(new Sprite_Object(obj,false));
        this._objectUpperLayerSprites.push(new Sprite_Object(obj,true));
    }, this);

    for (var i = 0; i < this._objectLowerLayerSprites.length; i++) {
        //addChild lower layer
        this._tilemap.addChild(this._objectLowerLayerSprites[i]);
        //addChild upper layer
        this._tilemap.addChild(this._objectUpperLayerSprites[i]);

    }
};

//=============================================================================
// End of File
//=============================================================================
