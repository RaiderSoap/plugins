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
    this._showCharacterPassing = true;
    this._opacity = 255;
    this._foundationGrids = data.foundationGrids;
    this._passableGrids = data.passableGrids; //the size of this array should be width*height (in 32)
                              //and it should store data like 0101, 1111, 1010 binary numbers
        // need to be fix
    this._width = data.width;
    this._height = data.height;
    this._deploying = false;
    if (x && y) {
        this._x = x; 
        this._y = y - 1; 
        this._areaRect = new Rectangle(this._x,this._y+1,this._width-1,this._height*2/3);
    }else{
        this._deploying = true;
        this._x = $gamePlayer.x; 
        this._y = $gamePlayer.y - 1; 
        this._areaRect = null;
    };
    //alert(this._deploying);
    this._movementCounter = 0;
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
    this.updateDeployment();
};
Game_Object.prototype.updateOpcaity = function() {
    if (this._showCharacterPassing && this._areaRect &&
            this._areaRect.contains($gamePlayer.x,$gamePlayer.y)) {
        this._opacity = 175;
    }else{
        this._opacity = 255;
    }
};
Game_Object.prototype.updateDeployment = function() {
    if (this._deploying) {
        $gameMap.pauseCharacters();
        this.moveByInput();
    }
};
Game_Object.prototype.moveByInput = function() {
    this._movementCounter--;
    if (this._movementCounter <= 0) {
        this._movementCounter = 5;
        switch(this.getInputDirection()){
            case 2: 
                this.moveStraight(2);
                break;
            case 4: 
                this.moveStraight(4);
                break;
            case 6: 
                this.moveStraight(6);
                break;
            case 8: 
                this.moveStraight(8);
                break;
        }
    }

        if (Input.isTriggered('ok')) {
            if (this.canDeploy()) {
                this.deployAt();
            }else{
                //this.deployAt();
                console.log("cannot");
            }

            
        }



};
Game_Object.prototype.moveStraight = function(d) {
        this._x = $gameMap.roundXWithDirection(this._x, d);
        this._y = $gameMap.roundYWithDirection(this._y, d);
};
Game_Object.prototype.getInputDirection = function() {
    return Input.dir4;
};
Game_Object.prototype.canDeploy = function() {
    for (var i = this._foundationGrids.length - 1; i >= 0; i--) {
        if (this._foundationGrids[i]===0) {
            continue;
        }
        var x = this._x + i % this._width;
        var y = this._y + i / this._width;
        y = ~~y;
        var mapIndex = x+ y*$dataMap.width;
        //check layer grid
        //console.log("x,y: "+x+", "+y);
        if ($gameMap._objectsFoundations[mapIndex] != 0) {
            return false;
        }else if (!$gameMap.checkPassage(x,y,0x0f)) {
            return false;
        }
    }
    return true;
};

Game_Object.prototype.deployAt = function() {
    this._deploying = false;
    $gameMap.restoreCharacters();
    $gameMap.deployObject(this);
    this._areaRect = new Rectangle(this._x,this._y+1,this._width-1,this._height*2/3);
};

//=============================================================================
// Game_Map
//=============================================================================
Game_CoreSystem.Core.Game_Map_initialize = Game_Map.prototype.initialize;
Game_Map.prototype.initialize = function() {
    this._objects = [];
    this._isPausingCharacters = false;
    Game_CoreSystem.Core.Game_Map_initialize.call(this);
    
}    
Game_CoreSystem.Core.Game_Map_setup = Game_Map.prototype.setup;
Game_Map.prototype.setup = function(mapId) {
    Game_CoreSystem.Core.Game_Map_setup.call(this,mapId);

    this.setupObjects();
    this.setupObjectsLayer();
};
Game_Map.prototype.pauseCharacters = function() {
    this._isPausingCharacters = true;
};
Game_Map.prototype.restoreCharacters = function() {
    this._isPausingCharacters = false;  
};
Game_Map.prototype.objects = function() {
    return this._objects.filter(function(obj) {
        return !!obj;
    });
};
Game_Map.prototype.setupObjects = function() {
    this._objects = [];
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
            this._objects.push(new Game_Object(objID,event.x,event.y));
            event.erase();
        };
        
    },this);
};
Game_Map.prototype.setupObjectsLayer = function() {
    this._objectsLayer = new Array(this.width()*this.height());
    this._objectsFoundations = new Array(this.width()*this.height());
    for (var i = this._objectsLayer.length - 1; i >= 0; i--) {
        this._objectsLayer[i] = 15;
        this._objectsFoundations[i] = 0;
    }    
    this._objects.forEach(function(object) {
        var index;
        for (var i = 0; i < object._passableGrids.length; i++) {
            index = object.indexToMapIndex(i);
            this._objectsLayer[index] &= object._passableGrids[i];
            this._objectsFoundations[index] |= object._foundationGrids[i];
        }
    },this);
    
};
Game_Map.prototype.makeObject = function(objectId) {
    var obj = new Game_Object(objectId);
    this._objects.push(obj);
    SceneManager._scene._spriteset.addObject(obj);
};
Game_Map.prototype.deployObject = function(object) {
    var index=0;
    for (var i = 0; i < object._passableGrids.length; i++) {
        index = object.indexToMapIndex(i);
        this._objectsLayer[index] &= object._passableGrids[i];
        this._objectsFoundations[index] |= object._foundationGrids[i];
        
    }
};
Game_CoreSystem.Core.Game_Map_isPassable = Game_Map.prototype.isPassable;
Game_Map.prototype.isPassable = function(x, y, d) {
    var width = $dataMap.width;
    return this.checkObjectPassage(x,y,d) && 
        Game_CoreSystem.Core.Game_Map_isPassable.call(this,x, y, d);
};
Game_Map.prototype.checkObjectPassage = function(x,y,d) {
    var width = $dataMap.width;
    return this._objectsLayer[x+width*y] & (1 << (d / 2 - 1));
};
Game_CoreSystem.Core.Game_Map_update = Game_Map.prototype.update;
Game_Map.prototype.update = function(sceneActive) {
    Game_CoreSystem.Core.Game_Map_update.call(this,sceneActive);
    this.updateObjects();
};
Game_Map.prototype.updateEvents = function() {
    if(!this._isPausingCharacters){
        this.events().forEach(function(event) {
            event.update();
        });
        this._commonEvents.forEach(function(event) {
            event.update();
        });
    }
};
Game_Map.prototype.updateObjects = function() {
    this.objects().forEach(function(obj) {
        obj.update();
    });
};
//-----------------------------------------------------------------------------
// Game_Player
//---------------------------------------------------------------------------- 
Game_CoreSystem.Core.Game_Player_update = Game_Player.prototype.update;
Game_Player.prototype.update = function(sceneActive) {
    if (!$gameMap._isPausingCharacters) {
        Game_CoreSystem.Core.Game_Player_update.call(this,sceneActive);
    }
};
Game_Player.prototype.tempCreateObject = function(objectId) {
    $gameMap.makeObject(objectId);
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
//SceneManager._scene._spriteset.addObject
Spriteset_Map.prototype.addObject = function(object) {
    var sprite1 = new Sprite_Object(object,false);
    var sprite2 = new Sprite_Object(object,true);
    this._objectLowerLayerSprites.push(sprite1);
    this._objectUpperLayerSprites.push(sprite2);
    this._tilemap.addChild(sprite1);
    this._tilemap.addChild(sprite2);
};








//=============================================================================
// End of File
//=============================================================================
