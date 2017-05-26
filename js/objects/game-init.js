import LU from 'display/layout-utils';
import M3E from 'm3e/m3e';
import Utils from 'm3e/utils';
import GameView from 'objects/game-view';
import GameCustomActions from 'objects/game-custom-actions';
import GameCustomDestroy from 'objects/game-custom-destroy';

export default class GameInit {
  constructor(game, view, startSettings) {
    this._game = game;
    this._view = view;
    this._startSettings = startSettings;
    this._gameView = new GameView(this._game, this._view);
    this._ctaTimer = new Date().getTime();
    this.startM3();
  }

  startM3() {
    this._e = new M3E(this);

    this._e.init(this._startSettings);

    let viewSettings = this._gameView.viewSettings;
    viewSettings.useEmitters = this._startSettings.useEmitters;
    viewSettings.simpleChipMoves = this._startSettings.simpleChipMoves;
    viewSettings.useEffects = this._startSettings.useEffects;

    this.initInputEvents(this._gameView);

    this._e.level.mView = this._gameView;

    this._e.level.cbShowCTA = (state) => {
      this._gameView._ctaView.show(state);
    };
    this._e.level.cbGetChipView = (chip) => {
      return new this._gameView.chip(this._game, this._gameView.gChips, this._gameView.gEffects, chip, viewSettings, this._gameView);
    };

    this._e.level.cbGetSlotView = (slot) => {
      return new this._gameView.slot(this._game, this._gameView.gSlots, slot, viewSettings);
    };

    this._e.level.cbGetBorderView = (border) => {
      return new this._gameView.border(this._game, this._gameView.gSlots, border, viewSettings);
    };

    this._e.level.cbFitSlotsView = () => {
      this._gameView.fitSlotsView();
    };

    this._e.level.cbFitChipsView = () => {
      this._gameView.fitChipsView();
    };

    this._e.level.cbShowHelpMove = (possibleMoves, time) => {
      this._gameView.showHelpMove(possibleMoves, time);
    };

    this._e.level.cbHideHelpMoves = () => {
      this._gameView.hideHelpMoves();
    };

    // Adding custom actions

    let customActions = new GameCustomActions(this._e, {
      max1Time: this._startSettings.tutorialStep1Time,
      max2Time: this._startSettings.tutorialStep2Time,
    });

    if (this._startSettings.showTutorial) {
      // init custom actions (tutorial)
      this._e.level.tutorialView = this._gameView._tutorialView;
      //use custom action after predefined boot action
      this._e.cb_boot_update = (action) => {
        if (action.mPendingExit) {
          action.nextActionName = 'tutorial';
        }
      };
    }


    // add custom special chips destroy patterns
    new GameCustomDestroy(this._e, this._gameView, customActions, this._startSettings.simpleChipMoves);

    // override chip move effects
    if (this._startSettings.simpleChipMoves === false) {
      const postEffectTime = 1.7;
      this._e.level.cbChipsPostMoveXFunction = (curVal, newVal, time) => {
        return Utils.interpolation(Phaser.Easing.Linear.None, curVal, curVal, time, postEffectTime);
      };

      this._e.level.cbChipsPostMoveYFunction = (curVal, newVal, time) => {
        return Utils.interpolation(Phaser.Easing.Linear.None, curVal, curVal, time, postEffectTime);
      };

      this._e.level.cbChipsPostScaleXFunction = (curVal, time) => {
        return Utils.interpolation(Phaser.Easing.Linear.None, curVal, curVal, time, postEffectTime);

      };

      this._e.level.cbChipsPostScaleYFunction = (curVal, time) => {
        return Utils.interpolation(Phaser.Easing.Linear.None, curVal, curVal, time, postEffectTime);
      };

      this._e.level.cbChipsPostRotateFunction = (curVal, time) => {
        return Utils.arrayInterpolation(Phaser.Easing.Sinusoidal.InOut, curVal, [-7, 7, -5, 5, -3, 3, 0], time, postEffectTime);
      };
    }


    // if pattern array length is 0 generates cube field with maxColumns and maxRows
    // b - is boot slot, st - slot type number (f=0), t - set special type on boot (t=0)


    if (this._startSettings.useSmallField) {
      this._e.level.fieldMask = new this._e.level.fieldGenerator(
          this._startSettings.inputType == 'swipe' ? LP([
            ['0,b,c=3', '0,b,c=1', '0,b,c=4', '0,b', '0,b', '0,b', '0,b'],
            ['0,c=1', '0,c=2', '0,c=1', '0,c=2', '0', '0', '0'],
            ['0,c=3', '0,c=3', '0,c=2', '0,c=4', '0', '0', '0'],
          ],[
            ['0,b,c=3', '0,b,c=1', '0,b,c=4', '0,b', '0,b'],
            ['0,c=1', '0,c=2', '0,c=1', '0,c=2', '0'],
            ['0,c=3', '0,c=3', '0,c=2', '0,c=4', '0'],
            ['0', '0', '0', '0', '0'],
            ['0', '0', '0', '0', '0'],
          ]) : LP([
            ['0,b', '0,b', '0,b', '0,b', '0,b', '0,b', '0,b'],
            ['0,c=1', '0,c=2', '0,c=1', '0,c=2', '0', '0', '0'],
            ['0,c=3', '0,c=3', '0,c=3', '0,c=4', '0', '0', '0'],
          ],[
            ['0,b,c=3', '0,b,c=3', '0,b,c=3', '0,b,c=2', '0,b'],
            ['0,c=1', '0,c=2', '0,c=1', '0,c=2', '0'],
            ['0', '0', '0', '0', '0'],
            ['0', '0', '0', '0', '0'],
            ['0', '0', '0', '0', '0'],
          ]),
          LP(7, 5), LP(3, 5));
    } else {
      this._e.level.fieldMask = new this._e.level.fieldGenerator(
          this._startSettings.inputType == 'swipe' ? LP([
            ['0,b,c=3', '0,b,c=1', '0,b,c=4', '0,b', '0,b', '0,b', '0,b', '0,b', '0,b', '0,b'],
            ['0,c=1', '0,c=2', '0,c=1', '0,c=2', '0', '0', '0', '0', '0', '0'],
            ['0,c=3', '0,c=3', '0,c=2', '0,c=4', '0', '0', '0', '0', '0', '0'],
          ],[
            ['0,b,c=3', '0,b,c=1', '0,b,c=4', '0,b', '0,b', '0,b', '0,b'],
            ['0,c=1', '0,c=2', '0,c=1', '0,c=2', '0', '0', '0'],
            ['0,c=3', '0,c=3', '0,c=2', '0,c=4', '0', '0', '0'],
            ['0', '0', '0', '0', '0', '0', '0'],
            ['0', '0', '0', '0', '0', '0', '0'],
            ['0', '0', '0', '0', '0', '0', '0'],
            ['0', '0', '0', '0', '0', '0', '0'],
          ]) : LP([
            ['0,b', '0,b', '0,b', '0,b', '0,b', '0,b', '0,b', '0,b', '0,b', '0,b'],
            ['0,c=1', '0,c=2', '0,c=1', '0,c=2', '0', '0', '0', '0', '0', '0'],
            ['0,c=3', '0,c=3', '0,c=3', '0,c=4', '0', '0', '0', '0', '0', '0'],
          ],[
            ['0,b,c=3', '0,b,c=3', '0,b,c=3', '0,b,с=2', '0,b', '0,b', '0,b'],
            ['0,c=1', '0,c=2', '0,c=1', '0,c=2', '0', '0', '0'],
            ['0,c=3', '0,c=3', '0,c=2', '0,c=4', '0', '0', '0'],
            ['0', '0', '0', '0', '0', '0', '0'],
            ['0', '0', '0', '0', '0', '0', '0'],
            ['0', '0', '0', '0', '0', '0', '0'],
            ['0', '0', '0', '0', '0', '0', '0'],
          ]),
          LP(10, 7), LP(3, 7));
    }
    // if (this._startSettings.useSmallField)
    //   this._e.level.fieldMask = new this._e.level.fieldGenerator([], LP(10, 5), LP(3, 5));
    // else
    //   this._e.level.fieldMask = new this._e.level.fieldGenerator([], LP(10, 7), LP(3, 7));


    this._e.level.autoMatchOnStart = this._startSettings.inputType != 'tap';
    this._e.level.canRefreshColours = true;

    this._e.level.dontMatchSortingEnable = this._startSettings.inputType != 'tap';

    this._e.specialDestroyBehavior.lineEffect = (angle, size, slot) => {
      this._gameView.effects.line(angle, size, slot);
    };

    this._e.specialDestroyBehavior.colorBombEffect = (slot, destroySlots) => {
      this._gameView.effects.colorBombEffect(slot, destroySlots);
    };

    this._e.specialDestroyBehavior.bombEffect = (size, slot) => {
      this._gameView.effects.bombEffect(size, slot);
    };

    this._e.specialDestroyBehavior.setDefaultPatterns();

    // init UI
    this._gameView.initUI({
      recipesInfo: this._e.level.gameType.recipesInfo,
    });

    this._e.level.cbUpdateScoreUI = (value) => {
      this._gameView._uiView.updateScore(value);
    };

    this._e.level.cbUpdateMovesUI = (value) => {
      this._gameView._uiView.updateMoves(value);
    };

    this._e.level.cbUpdateRecipesUI = () => {
      this._gameView._uiView.updateRecipes();
    };

    this._gameView.fitUIView();
    this._gameView._uiView.updateScore(this._e.currentScore);
    this._gameView._uiView.updateMoves(this._e.currentMoves);

  }

  initInputEvents(gameView) {
    this._game.input.onDown.add(() => {
      this._e.mInput.onDown = true;
      this._ctaTimer = new Date().getTime();
      wrapper_mark_interaction();
    });

    this._game.input.onUp.add(() => {
      this._e.mInput.onDown = false;
    });

    this._game.input.addMoveCallback((pointer, x, y) => {
      let gridPos = this._game.input.getLocalPosition(gameView.gSlots, new Phaser.Point(x, y));
      this._e.mInput.x = Math.floor((gridPos.x) / gameView.viewSettings.slot.width);
      this._e.mInput.y = Math.floor((gridPos.y) / gameView.viewSettings.slot.height);
    });
  }

  update() {
    let dt = this._game.time.elapsed * 0.001;
    this._e.update(dt);
    this._gameView._uiView.updateRecipes();
    if (new Date().getTime() > this._ctaTimer + this._startSettings.ctaIdleTime && !this._e.mActionsPause) {
      this._gameView._tutorialView.removeAll();
      this._e.pauseAllActions();
      this._e.removeAllActions();
      this._e.level.cbShowCTA();

    }
  }
}
