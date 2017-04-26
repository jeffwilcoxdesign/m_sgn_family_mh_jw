/*jshint -W069 */
/*jshint -W041 */

import BootAction from 'm3e/action';
import Utils from 'm3e/utils';


export default class Level {
  constructor(m3e) {
    this.m3e = m3e;

    this.cbGetChipView = this.emptyFunction;
    this.cbGetSlotView = null;
    this.cbFitChipsView = null;
    this.cbFitSlotsView = null;
    this.cbShowHelpMove = null;
    this.cbHideHelpMoves = null;

    this.cbUpdateScoreUI = null;
    this.cbUpdateMovesUI = null;
    this.cbUpdateRecipesUI = null;
    this.cbShowCTA = null;

    this.initMoves();
    this.gameTypes = {};
    this.gameTypes['recipe'] = RecipeGameType;
    this.gameTypes['score'] = ScoreGameType;
    this.gameTypes['custom'] = CustomGameType;


    this.mView = null;

    this.matchPatterns = MatchPatterns;
    this.fieldGenerator = FieldGenerator;
    this.matchPatterns = new this.matchPatterns().getPatterns();
    this.dontMatchSortingEnable = false;
    this.autoMatchOnStart = true;
    this.canRefreshColours = true;
    this.fieldMask = new this.fieldGenerator();

    //s - canSwap , m - canMatch, f - canFall  -> 0-false, 1 true
    this.chipSettings = new ChipSettings(['7,s=0,m=0,f=0','8,s=0,m=0,f=0']);

    this.mGameSettings = {
      maxColors: 4,
      gameType: 'recipe,2-10,2-10,2-10,2-10',
      maxMoves: 25,
      maxScore: 0,
      scoreAddByChip: 10,
      highlighHelperTime: 5,
      inputType: 'swipe'
    };
  }

  initGameType(type) {
    type = type.split(",");
    let gameType = type.shift();
    this.gameType = new this.gameTypes[gameType](this.gameSettings.maxColors, type);
  }

  get gameSettings() {
    return this.mGameSettings;
  }

  checkEndGame() {
    let state = {
      win: false,
      lose: false,
    };
    if (this.m3e.currentScore >= this.gameSettings.maxScore && this.gameSettings.maxScore != 0) {
      state.win = true;
    }
    if (this.m3e.currentMoves <= 0) {
      state.lose = true;
    }

    let recipesDone = true;
    if (this.gameType.mType === 'recipe') {
      for (let r of this.gameType.recipesInfo) {
        if (r.count > 0) recipesDone = false;
      }
    }
    else
      recipesDone = false;


    if (recipesDone) state.win = true;
    if (state.win || state.lose) {
      this.cbShowCTA(state);
      this.m3e.removeAllActions();
      this.m3e.pauseAllActions();
    }
  }

  initMoves() {
    this.cbChipsMoveFunction = this.linearMove;
    this.cbChipsMoveXEndFunction = this.linearMove;
    this.cbChipsMoveYEndFunction = this.linearMove;

    this.cbChipsMoveScaleXFunction = this.linearScale;
    this.cbChipsMoveScaleYFunction = this.linearScale;
    this.cbChipsMoveScaleXEndFunction = this.linearScale;
    this.cbChipsMoveScaleYEndFunction = this.linearScale;

    // if set to as null there no postmove effect
    this.cbChipsPostMoveXFunction = null;
    this.cbChipsPostMoveYFunction = null;
    this.cbChipsPostScaleXFunction = null;
    this.cbChipsPostScaleYFunction = null;
    this.cbChipsPostRotateFunction = null;


    this.cbChipsSwapMoveXFunction = this.linearMove;
    this.cbChipsSwapMoveYFunction = this.linearMove;
    this.cbChipsSwapScaleXFunction = this.linearScale;
    this.cbChipsSwapScaleYFunction = this.linearScale;

    this.cbChipsSwapMoveInXFunction = this.linearMove;
    this.cbChipsSwapMoveInYFunction = this.linearMove;
    this.cbChipsSwapScaleInXFunction = this.linearScale;
    this.cbChipsSwapScaleInYFunction = this.linearScale;

    this.cbChipsSwapMoveOutXFunction = this.linearMove;
    this.cbChipsSwapMoveOutYFunction = this.linearMove;
    this.cbChipsSwapScaleOutXFunction = this.linearScale;
    this.cbChipsSwapScaleOutYFunction = this.linearScale;
  }

  getMoveFunctions() {
    return {
      move: this.cbChipsMoveFunction,
      moveXEnd: this.cbChipsMoveXEndFunction,
      moveYEnd: this.cbChipsMoveYEndFunction,
      scaleX: this.cbChipsMoveScaleXFunction,
      scaleY: this.cbChipsMoveScaleYFunction,
      scaleEndX: this.cbChipsMoveScaleXEndFunction,
      scaleEndY: this.cbChipsMoveScaleYEndFunction,
      postMoveX: this.cbChipsPostMoveXFunction,
      postMoveY: this.cbChipsPostMoveYFunction,
      postScaleX: this.cbChipsPostScaleXFunction,
      postScaleY: this.cbChipsPostScaleYFunction,
      postRotate: this.cbChipsPostRotateFunction,
      swapX: this.cbChipsSwapMoveXFunction,
      swapY: this.cbChipsSwapMoveYFunction,
      swapScaleX: this.cbChipsSwapScaleXFunction,
      swapScaleY: this.cbChipsSwapScaleYFunction,
      swapBackInX: this.cbChipsSwapMoveInXFunction,
      swapBackInY: this.cbChipsSwapMoveInYFunction,
      swapBackOutX: this.cbChipsSwapMoveOutXFunction,
      swapBackOutY: this.cbChipsSwapMoveOutYFunction,
      swapBackInScaleX: this.cbChipsSwapScaleInXFunction,
      swapBackInScaleY: this.cbChipsSwapScaleInYFunction,
      swapBackOutScaleX: this.cbChipsSwapScaleOutXFunction,
      swapBackOutScaleY: this.cbChipsSwapScaleOutYFunction
    };
  }

  linearMove(curVal, newVal, time) {
    return Utils.interpolation((k)=> {
      return k;
    }, curVal, newVal, time, 8);
  }

  linearScale(curVal, time) {
    return Utils.interpolation((k)=> {
      return k;
    }, curVal, curVal, time, 8);
  }

  init(levelData) {
    if (levelData) {
      this.mGameSettings =
      {
        maxColors: levelData.maxColors,
        gameType: levelData.gameType,
        maxMoves: levelData.maxMoves,
        maxScore: levelData.maxScore,
        scoreAddByChip: levelData.scoreAddByChip,
        highlighHelperTime: levelData.highlighHelperTime,
        inputType: levelData.inputType,

      };
    }

    this.m3e.initMatcher(this.gameSettings.inputType);
    this.initGameType(this.gameSettings.gameType);
  }

  get view() {
    return this.mView;
  }
}

class FieldGenerator {
  constructor(customFieldPattern = [], maxColumns = 10, maxRows = 10) {
    if (customFieldPattern.length == 0)
      return this.generate(maxColumns, maxRows);
    else
      return this.customField(customFieldPattern);
  }

  /**
   * Generate a field map array
   * @return {string[][]}; 0 - is random color, 1-... specified color, -1 empty slot, -2.. special slots
   */
  generate(maxColumns, maxRows) {
    let field = [];
    field.mask = Array.apply(null, Array(maxColumns)).map(e => Array(maxRows).fill('0'));
    field.totalColumns = field.mask.length - 1;
    field.totalRows = field.mask[0].length - 1;
    for (let i = 0; i <= field.totalColumns; i++) {
      field.mask[i][0] += ',b';
    }
    return field;
  }

  //0 - empty 1 - regular slot, b-boot,
  customField(fieldMask) {
    let field = {};
    field.mask = fieldMask;
    field.totalColumns = field.mask.length - 1;
    field.totalRows = field.mask[0].length - 1;
    field.mask = this.swapFieldMask(field.mask);
    [field.totalColumns, field.totalRows] = [field.totalRows, field.totalColumns];
    return field;
  }

  swapFieldMask(field) {
    return Object.keys(field[0]).map(c => field.map(r => r[c]));
  }
}

class GameType {
  constructor(type) {
    this.mType = type;
  }
}

class ScoreGameType extends GameType {
  constructor() {
    super('score');

    this.mScore = 0;
    this.mMaxScore = 1000;
    this.mMinScore = 5000;
  }
}

class CustomGameType extends GameType {
  constructor() {
    super('custom');
  }

  setProp(propName, value)
  {
    this[propName] = value;
  }

  getProp(propName)
  {
    return this[propName];
  }
}

class RecipeGameType extends GameType {
  constructor(maxColors, params) {
    super('recipe');
    this._maxRecipeItems = 0;
    this._itemSettings = [];
    //console.log(params)
    for (let p of params) {

      p = p.split('|');
      let type = p[0];
      let color = p[1];
      p = p[2].split('-');
      //console.log(p, type)

      if (this._maxRecipeItems < maxColors) {
        this._itemSettings.push({min: parseInt(p[0]), max: parseInt(p[1]), type: type, color:color});
        this._maxRecipeItems++;
      }
    }
    this.mRecipe = [];
    this.generateRecipes();
  }

  generateRecipes() {
    while (--this._maxRecipeItems >= 0) {
      this.mRecipe.push({
        color: this._itemSettings[this._maxRecipeItems].color,
        type: this._itemSettings[this._maxRecipeItems].type,
        count: Utils.random(this._itemSettings[this._maxRecipeItems].min, this._itemSettings[this._maxRecipeItems].max)
      });
    }
    this.mRecipe = Utils.shuffleArray(this.mRecipe);
  }

  get recipesInfo() {
    return this.mRecipe;
  }
}

class ChipSettings {
  constructor(settings) {
    this._settings = settings;
    this._chipSettings = [];
    this.initSettings();
  }

  initSettings() {
    for (let s of this._settings) {
      let settings = s.split(',');
      let chipType = settings.shift();

      let canFall = this.getParams('f', settings);
      canFall = canFall.exist ? canFall.result === 0 ? false : true : true;

      let canSwap = this.getParams('s', settings);
      canSwap = canSwap.exist ? canSwap.result === 0 ? false : true : true;

      let canMatch = this.getParams('m', settings);
      canMatch = canMatch.exist ? canMatch.result === 0 ? false : true : true;

      this._chipSettings.push({
        chipType: parseInt(chipType),
        canFall: canFall,
        canSwap: canSwap,
        canMatch: canMatch,
      });
    }
  }

  getParams(targetParam, data) {
    for (let str of data) {
      if (str.indexOf(targetParam) == 0) {
        let result = str.split('=');
        if (result.length > 1) {
          return {exist: true, result: parseInt(result[1])};
        }
        else {
          return {exist: false};
        }
      }
    }
    return {exist: false};
  }

  getChipSettings(type) {
    let canFall = true;
    let canSwap = true;
    let canMatch = true;

    for (let s of this._chipSettings) {
      if (s.chipType == type)
      {
        canFall = s.canFall;
        canSwap = s.canSwap;
        canMatch = s.canMatch;
      }
    }

    return {canFall, canSwap, canMatch};
  }
}

class MatchPatterns {
  constructor() {
    this.p_line_3_1 = [
      [1, 1, 1]
    ];

    this.p_line_3_2 = [
      [1],
      [1],
      [1]
    ];

    this.p_line_4_1 = [
      [1, 1, 1, 1]
    ];

    this.p_line_4_2 = [
      [1],
      [1],
      [1],
      [1]
    ];

    this.p_line_5_1 = [
      [1, 1, 1, 1, 1]
    ];

    this.p_line_5_2 = [
      [1],
      [1],
      [1],
      [1],
      [1]
    ];

    this.p_line_6_1 = [
      [1, 1, 1, 1, 1, 1]
    ];

    this.p_line_6_2 = [
      [1],
      [1],
      [1],
      [1],
      [1],
      [1]
    ];

    this.p_l_1 = [
      [1, 1, 1],
      [0, 0, 1],
      [0, 0, 1],
    ];

    this.p_l_2 = [
      [0, 0, 1],
      [0, 0, 1],
      [1, 1, 1],
    ];

    this.p_l_3 = [
      [1, 0, 0],
      [1, 0, 0],
      [1, 1, 1],
    ];

    this.p_l_4 = [
      [1, 1, 1],
      [1, 0, 0],
      [1, 0, 0],
    ];

    this.p_t_1 = [
      [1, 0, 0],
      [1, 1, 1],
      [1, 0, 0],
    ];

    this.p_t_2 = [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 1],
    ];

    this.p_t_3 = [
      [1, 1, 1],
      [0, 1, 0],
      [0, 1, 0],
    ];

    this.p_t_4 = [
      [0, 1, 0],
      [0, 1, 0],
      [1, 1, 1],
    ];
  }

  getPatterns() {
    // chipType - chipType, chipColor (-1 universalColor match with all colors)
    return [
      {pattern: this.p_line_6_1, chipType: null},
      {pattern: this.p_line_6_2, chipType: null},
      {pattern: this.p_line_5_1, chipType: null},
      {pattern: this.p_line_5_2, chipType: null},
      {pattern: this.p_line_4_1, chipType: '2'},
      {pattern: this.p_line_4_2, chipType: '1'},
      {pattern: this.p_l_1, chipType: '4'},
      {pattern: this.p_l_2, chipType: '4'},
      {pattern: this.p_l_3, chipType: '4'},
      {pattern: this.p_l_4, chipType: '4'},
      {pattern: this.p_t_1, chipType: '3'},
      {pattern: this.p_t_2, chipType: '3'},
      {pattern: this.p_t_3, chipType: '3'},
      {pattern: this.p_t_4, chipType: '3'},
      {pattern: this.p_line_3_1, chipType: null},
      {pattern: this.p_line_3_2, chipType: null},
    ];
  }
}
