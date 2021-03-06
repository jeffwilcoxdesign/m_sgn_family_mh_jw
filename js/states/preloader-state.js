import Globals from 'kernel/globals';
import LU from 'display/layout-utils';

import {css_fonts} from '../../creative.json';

Globals.font = 'fresca';
window.WebFontConfig = {
  active: () => {
    Globals.FONT_IS_LOADED = true;
  },
  custom: {
    families: css_fonts,
    urls: ['./css/mraid_wrapper.min.css']
  }
};

export default class PreloaderState extends Phaser.State {
  init() {
    this.stage.backgroundColor = "#010101";
    this.stage.disableVisibilityChange = true;

    this.scale.scaleMode = Phaser.ScaleManager.USER_SCALE;

    this.game.scale.setResizeCallback(x => {
      let userRatio = this.game.device.pixelRatio * LU.RENDER_RESOLUTION;

      x.setGameSize(window.innerWidth * userRatio, (window.innerHeight * userRatio));
      x.setUserScale(1 / userRatio, 1 / userRatio);
    });
    this.game.scale.onSizeChange.add(x => this.game.state.callbackContext.resize());

    this.scale.refresh();

    LU.refreshViewDimmensions();
  }


  preload() {
    this.game.load.script('webfont', 'https://ajax.googleapis.com/ajax/libs/webfont/1.4.7/webfont.js');
    imageLoader.registerGame(this.game);

    let root = Globals.WEB_ROOT + '/img/backgrounds/';

    imageLoader.loadImage('topBackground', `${root}bg.jpg`);
    imageLoader.loadImage('background', `${root}back.jpg`);

    // Preload an random background
    imageLoader.loadAtlas('assets', Globals.WEB_ROOT + '/texture_sheets/assets.png');
  }

  create() {
    wrapper_preload_complete();
  }

  loadUpdate() {
    wrapper_load_progress(this.game.load.progress);
  }

  update() {
    if (ad_state === 'ready') {
      ad_state = 'live';
      this.state.start('GameState');

    }
  }
}
