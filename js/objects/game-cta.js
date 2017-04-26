import LU from 'display/layout-utils';
import Globals from 'kernel/globals';

export default class GameCTA {
  constructor(game, view) {
    this._game = game;
    this._view = view;
    this._view.x = LU.LEFT_OFFSET;
    this._view.y = LU.TOP_OFFSET;
    this.testStyle = {
      font: "45px Fresca",
      fill: '#ffffff',
      boundsAlignH: "center",
      boundsAlignV: "middle",
      align: "center",
      stroke: "#000000",
      strokeThickness: 8,
    };
  }

  show() {
    this._game.time.events.add(1000, ()=> {
      wrapper_mark_cta();

      let canRetry = Globals.REPLAYS_NUMBER > 0;
      let background_overlay = this._game.add.graphics(0, 0);
      background_overlay.beginFill(0x000000, 1);
      background_overlay.drawRect(0, 0, LU.FULL_GAME_WIDTH, LU.FULL_GAME_HEIGHT);
      background_overlay.alpha = 0;
      background_overlay.endFill();
      background_overlay.inputEnabled = true;
      this._view.add(background_overlay);
      let backTwn = this._game.add.tween(background_overlay).to({
        alpha: 0.8
      }, 500, Phaser.Easing.Sinusoidal.InOut);
      backTwn.start();

      this._game.time.events.add(500, ()=> {
        let gCTA = this._game.add.group();
        background_overlay.events.onInputDown.add(function () {
          wrapper_click_go();
        });

        let img = imageLoader.sprite(0, 0, 'cta.png');
        img.anchor.set(0.5);


        let logo = imageLoader.sprite(0, -250, 'logo.png');
        logo.anchor.set(0.5);

        let continueBtn = imageLoader.sprite(canRetry ? 125 : 0, 230, 'green_button.png');
        continueBtn.anchor.set(0.5);
        let btnText = this._game.add.text(0, 0, 'Play Now!', this.testStyle);
        btnText.anchor.set(0.5);
        let retryBtn = null;
        let retryText = null;
        if (canRetry) {
          retryBtn = imageLoader.sprite(-125, 230, 'blue_button.png');
          retryBtn.anchor.set(0.5);
          retryBtn.inputEnabled = true;
          retryBtn.events.onInputDown.add(()=> {
            Globals.REPLAYS_NUMBER--;
            this._game.state.start(this._game.state.current);
          });

          retryText = this._game.add.text(0, 0, 'Retry', this.testStyle);
          retryText.anchor.set(0.5);
        }

        gCTA.add(img);
        img.addChild(logo);
        if (canRetry)
          img.addChild(retryBtn);
        img.addChild(continueBtn);

        this._view.add(gCTA);

        continueBtn.addChild(btnText);
        if (canRetry)
          retryBtn.addChild(retryText);


        let heightScaleFactor = ((LU.FULL_GAME_HEIGHT - LU.getHeaderHeight()) * 0.9) / gCTA.height;
        let widthScaleFactor = (LU.FULL_GAME_WIDTH / gCTA.width) * 0.9;
        gCTA.scale.set(Math.min(heightScaleFactor, widthScaleFactor));

        gCTA.x = LU.FULL_GAME_WIDTH * 0.5;
        gCTA.y = LU.FULL_GAME_HEIGHT * 0.5 + LU.getHeaderHeight();

        img.scale.set(0);
        logo.scale.set(0);
        continueBtn.scale.set(0);
        if (canRetry)
          retryBtn.scale.set(0);

        this._game.add.tween(img.scale).to({
          x: 1,
          y: 1
        }, 800, Phaser.Easing.Elastic.Out, true, 0, 0, false);
        this._game.add.tween(logo.scale).to({
          x: 1,
          y: 1
        }, 800, Phaser.Easing.Elastic.Out, true, 200, 0, false).onComplete.add(()=> {
          this._game.add.tween(logo.scale).to({
            x: [1.1, 1],
            y: [1.1, 1]
          }, 1500, Phaser.Easing.Linear.None, true, 0, -1, false);
        });

        this._game.add.tween(logo).to({
          angle: [-3, 0, 3, 0, -1, 0, 1, 0],

        }, 1500, Phaser.Easing.Linear.None, true, 0, -1, false);


        this._game.add.tween(continueBtn.scale).to({
          x: 1,
          y: 1
        }, 800, Phaser.Easing.Elastic.Out, true, 300, 0, false).onComplete.add(()=> {
          this._game.add.tween(continueBtn.scale).to({
            x: [0.95, 1, 1.05, 1],
            y: [1.05, 1, 0.95, 1]
          }, 1500, Phaser.Easing.Linear.None, true, 0, -1, false);

        });

        if (canRetry) {
          this._game.add.tween(retryBtn.scale).to({
            x: 1,
            y: 1
          }, 800, Phaser.Easing.Elastic.Out, true, 300, 0, false).onComplete.add(()=> {
            this._game.add.tween(retryBtn.scale).to({
              x: [0.95, 1, 1.05, 1],
              y: [1.05, 1, 0.95, 1]
            }, 1500, Phaser.Easing.Linear.None, true, 0, -1, false);
          });
        }

      });
    });
  }
}
