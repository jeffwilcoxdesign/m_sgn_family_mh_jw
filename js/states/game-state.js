/*jshint -W041 */
import Globals from 'kernel/globals';
import LU from 'display/layout-utils';
import GameInit from 'objects/game-init';

class GameState extends Phaser.State {
  create() {
   // LU.RENDER_RESOLUTION = 1 / LU.getDevicePixelRatio();
    LU.refreshViewDimmensions();
    this.game.time.desiredFps = 60;
    this.game.time.advancedTiming = false;

    this.params = utils.getAdParameters({
      cta_on_idle_time: {type: 'int', default: 250000},
      show_tutorial: {type: 'bool', default: true},
      tutorial_step_1_time: {type: 'int', default: 5},
      tutorial_step_2_time: {type: 'int', default: 50},
      max_moves: {type: 'int', default: 25},
      max_colors: {type: 'int', default: 5},
      max_score: {type: 'int', default: 0},
      input_type: {type: 'string', default: 'swipe'}, // can be 'tap' or 'swipe'
      game_type_pattern:  {type: 'string', default: 'recipe,0|4|2-10,0|1|2-10,0|0|2-10'}, // game type ,if recipe (6 - type, 0-color,1-1 min and max value for random)
      score_add_by_chip: {type: 'int', default: 10},
      highligh_helper_time: {type: 'int', default: 5},
      // performance /view settings
      performance_mode_auto: {type: 'bool', default: false}, // automatically set for using minimal effects in canvas mode and max in WebGL
      use_emitters: {type: 'bool', default: true},
      simple_chip_moves: {type: 'bool', default: false},
      use_effects: {type: 'bool', default: true},
      use_small_field: {type: 'bool', default: false},
      replays_number: {type: 'int', default: 1},
    });

    if(Globals.REPLAYS_NUMBER == null)
      Globals.REPLAYS_NUMBER = this.params.replays_number;

    if(this.params.performance_mode_auto && this.game.renderType === Phaser.CANVAS)
    {
      this.params.use_emitters = false;
      this.params.simple_chip_moves = true;
      this.params.use_effects = false;
      this.params.use_small_field = true;
    }
    this.createUserInterface();
  }

  createUserInterface() {
    // this.bg = imageLoader.sprite(0, 0, 'background');
    this.view = this.game.add.group();

    window.addEventListener("resize", x => this.onResize(x));
    this.onResize(null);
    let startSettings = this.initStartSettings();
    this._gameStart = new GameInit(this.game, this.view, startSettings);
    // Hide MRAID overlay
    wrapper_hide_splash();
  }

  initStartSettings() {
    let settings = {
      ctaIdleTime: this.params.cta_on_idle_time,
      showTutorial: this.params.show_tutorial,
      tutorialStep1Time: this.params.tutorial_step_1_time,
      tutorialStep2Time: this.params.tutorial_step_2_time,
      maxMoves: this.params.max_moves,
      maxScore: this.params.max_score,
      maxColors: this.params.max_colors,
      gameType: this.params.game_type_pattern,
      scoreAddByChip: this.params.score_add_by_chip,
      highlighHelperTime: this.params.highligh_helper_time,
      inputType: this.params.input_type,

      useEmitters: this.params.use_emitters,
      simpleChipMoves: this.params.simple_chip_moves,
      useEffects: this.params.use_effects,
      useSmallField: this.params.use_small_field,
    };
    return settings;
  }

  update() {
    super.update();
    this._gameStart.update();
  }


  onResize() {
    // Reconfigure layout to match viewport size
    LU.RENDER_RESOLUTION = Math.max(1,1 / LU.getDevicePixelRatio());
    LU.refreshViewDimmensions();

    // VIEW_WIDTH and VIEW_HEIGHT are in 1:1 space
    // LU.fitIntoRect(this.bg, {
    //   x: 0,
    //   y: 0,
    //   width: LU.VIEW_WIDTH,
    //   height: LU.VIEW_HEIGHT
    // }, true, 'middleCenter');

    // fit the view group into viewport
    LU.centerIntoView(this.view);
  }
}

export default GameState;
