import LU from 'display/layout-utils';
import PreloaderState from './states/preloader-state';
import GameState from './states/game-state';

class Game extends Phaser.Game {
  constructor() {
    super('100%', '100%', Phaser.CANVAS, LU.CONTAINER_NAME, null);

    this.state.add('PreloaderState', PreloaderState, false);
    this.state.add('GameState', GameState, false);
    this.state.start('PreloaderState');
  }
}

new Game();
