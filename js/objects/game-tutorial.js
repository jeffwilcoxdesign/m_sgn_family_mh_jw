/*jshint -W041 */
import LU from 'display/layout-utils';

export default class GameTutorial {
  constructor(game, view, slotsView, viewSettings, uiView) {
    this._game = game;
    this._view = view;
    this._slotsView = slotsView;
    this._viewSettings = viewSettings;
    this._uiView = uiView;

    this._gHighlight = this._game.add.group();
    this._gHelperPanel = this._game.add.group();
    this._helpPanelsTmp = [];

    this._view.add(this._gHighlight);
    this._view.add(this._gHelperPanel);
    this._cachedTweens = [];

  }

  highlightCircle(targetSprite, radius = 160, scaleFactor = 1) {

    this._game.time.events.add(this._game.time.timeToCall, ()=> {
      let bmd = this._game.make.bitmapData(LU.FULL_GAME_WIDTH + 50, LU.FULL_GAME_HEIGHT + 50);
      const radius1 = radius * scaleFactor;
      const radius2 = 3 * Math.max(LU.FULL_GAME_WIDTH, LU.FULL_GAME_HEIGHT);
      let x = targetSprite.worldPosition.x;
      let y = targetSprite.worldPosition.y;
      let newPos = this._game.input.getLocalPosition(this._view, new Phaser.Point(x, y));
      const xOffset = -5 * scaleFactor;
      const yOffset = LP(40, 60) * scaleFactor;
      x = newPos.x - LU.LEFT_OFFSET + xOffset;

      y = newPos.y - LU.TOP_OFFSET - targetSprite.height * 0.5 * scaleFactor + yOffset;

      let innerCircle = new Phaser.Circle(x, y, radius1);
      let outerCircle = new Phaser.Circle(x, y, radius2);

      var grd = bmd.context.createRadialGradient(innerCircle.x, innerCircle.y, innerCircle.radius, outerCircle.x, outerCircle.y, outerCircle.radius);
      grd.addColorStop(0, 'rgba(0,0,0,0)');
      grd.addColorStop(((radius1 - 1) / radius2), 'rgba(0,0,0,0)');
      grd.addColorStop((radius1 / radius2), 'rgba(0,0,0,0.7)');
      grd.addColorStop(((radius1 * 5) / radius2), 'rgba(0,0,0,0.85)');
      grd.addColorStop(1, 'rgba(0,0,0,1)');
      bmd.circle(outerCircle.x, outerCircle.y, outerCircle.radius, grd);
      this._circle = this._game.add.sprite(LU.LEFT_OFFSET, LU.TOP_OFFSET, bmd);
      this._gHighlight.add(this._circle);
      this._circle.alpha = 0;
      this._game.add.tween(this._circle)
          .to({
            alpha: 1,
          }, 1000, Phaser.Easing.Sinusoidal.Out, true).start();
    });
  }

  highlightField(findResult) {
    this._game.time.events.add(this._game.time.timeToCall, () => {

      const height = LU.FULL_GAME_HEIGHT + (10 - LU.FULL_GAME_HEIGHT % 10);
      const width = LU.FULL_GAME_WIDTH + (10 - LU.FULL_GAME_WIDTH % 10);

      let bmd = this._game.make.bitmapData(width, height);
      let ctx = bmd.ctx;
      ctx.fillStyle = 'rgba(1,1,1,0.8)';
      ctx.fillRect(0, 0, width, height);

      let imgData = ctx.getImageData(0, 0, width, height);

      let slotViews = findResult;

      let gSlots = this._slotsView;
      let dx = gSlots.x - LU.LEFT_OFFSET;
      let dy = gSlots.y - LU.TOP_OFFSET;
      let sc = gSlots.scale.x;

      for (let slotView of slotViews) {
        let x = (slotView.x - this._viewSettings.slot.width * 0.5) * sc + dx;
        let y = (slotView.y - this._viewSettings.slot.height * 0.5) * sc + dy;

        for (let i = 0; i < this._viewSettings.slot.width * sc; i++) {
          for (let j = 0; j < this._viewSettings.slot.height * sc; j++) {
            let alphaIndex = ((~~(y + i) * width + ~~(x + j)) << 2) + 3;
            imgData.data[alphaIndex] = 0;
          }
        }
        bmd.context.putImageData(imgData, 0, 0);
        bmd.update();
      }
      this._maskSprite = this._game.make.sprite(LU.LEFT_OFFSET, LU.TOP_OFFSET, bmd);
      this._maskSprite.alpha = 0;
      this._gHighlight.add(this._maskSprite);

      // hack for fixing iOs bitmap bug
      this._game.time.events.add(500, ()=> {
        bmd.update();
        this._game.add.tween(this._maskSprite).to({
          alpha: 1
        }, 1000, Phaser.Easing.Sinusoidal.Out, true, 0, 0, false);
      });
    });
  }

  highlight() {
    let bmd = this._game.make.bitmapData(LU.FULL_GAME_WIDTH, LU.FULL_GAME_HEIGHT);
    let ctx = bmd.ctx;
    ctx.fillStyle = 'rgba(1,1,1,1)';
    ctx.fillRect(0, 0, LU.FULL_GAME_WIDTH, LU.FULL_GAME_HEIGHT);
    this._highlight = this._game.add.sprite(LU.LEFT_OFFSET, LU.TOP_OFFSET, bmd);
    this._gHelperPanel.add(this._highlight);
    this._highlight.alpha = 0;
    this._game.add.tween(this._highlight).to({
      alpha: 0.8
    }, 1000, Phaser.Easing.Sinusoidal.Out, true, 200, 0, false);

  }

  destroyHighlight() {
    this._game.add.tween(this._highlight).to({
      alpha: 0
    }, 1000, Phaser.Easing.Sinusoidal.Out, true, 0, 0, false).onComplete.add(()=> {
      this._highlight.destroy();
    });
  }

  moveElements(sprite1, sprite2) {
    this._game.time.events.add(this._game.time.timeToCall, () => {

      const temPos1 = {x: sprite1.x, y: sprite1.y};
      const temPos2 = {x: sprite2.x, y: sprite2.y};
      const arrowWidth = 150;

      this._arrow = imageLoader.sprite(0, 0, 'hand.png');
      this._arrow.anchor.setTo(0, 0.3);
      this._arrow.scale.set(0);

      let x1 = sprite1.worldPosition.x;
      let y1 = sprite1.worldPosition.y;
      let x2 = sprite2.worldPosition.x;
      let y2 = sprite2.worldPosition.y;

      let sprt1InViewPos = this._game.input.getLocalPosition(this._view, new Phaser.Point(x1, y1));
      let sprt2InViewPos = this._game.input.getLocalPosition(this._view, new Phaser.Point(x2, y2));

      if (temPos1.x != temPos2.x) {
        sprt1InViewPos.y += sprite1.height * 0.5;
        sprt2InViewPos.y += sprite1.height * 0.5;
        if (sprt1InViewPos.y + arrowWidth > this._view.height) {
          this._arrow.angle = 180;
          sprt1InViewPos.y -= sprite1.height;
          sprt2InViewPos.y -= sprite1.height;
        }
      }
      else {
        this._arrow.angle = 90;
        sprt1InViewPos.x -= sprite1.width * 0.5;
        sprt2InViewPos.x -= sprite1.width * 0.5;
        if (sprt1InViewPos.x - arrowWidth < arrowWidth) {
          this._arrow.angle = -90;
          sprt1InViewPos.x += sprite1.width;
          sprt2InViewPos.x += sprite1.width;
        }
        this._arrow.y = sprt1InViewPos.y;
      }
      this._arrow.x = sprt1InViewPos.x;
      this._arrow.y = sprt1InViewPos.y;
      this._gHighlight.add(this._arrow);

      let twn1 = this._game.add.tween(sprite1).to({
        x: [temPos2.x, temPos1.x],
        y: [temPos2.y, temPos1.y],
      }, 1000, Phaser.Easing.Sinusoidal.Out, true, 0, -1, false);

      let twn2 = this._game.add.tween(this._arrow).to({
        x: [sprt2InViewPos.x, sprt1InViewPos.x],
        y: [sprt2InViewPos.y, sprt1InViewPos.y],
      }, 1000, Phaser.Easing.Sinusoidal.Out, true, 0, -1, false);

      let twn3 = this._game.add.tween(this._arrow.scale).to({
        x: 1,
        y: 1
      }, 1500, Phaser.Easing.Elastic.Out, true, 500, 0, false);

      let twn4 = this._game.add.tween(sprite2).to({
        x: [temPos1.x, temPos2.x],
        y: [temPos1.y, temPos2.y],
      }, 1000, Phaser.Easing.Sinusoidal.Out, true, 0, -1, false);

      this._cachedTweens.push(twn1);
      this._cachedTweens.push(twn2);
      this._cachedTweens.push(twn3);
      this._cachedTweens.push(twn4);
    });
  }

  drawHelpPanelRecipes(cb) {
    this._game.time.events.add(this._game.time.timeToCall + 200, () => {

      let gHelpPanel = this._game.add.group();
      gHelpPanel.y-=LU.FULL_GAME_HEIGHT*LP(0.4, 0.3);
      let backPanel = imageLoader.sprite(LU.FULL_GAME_WIDTH * 0.5, LU.FULL_GAME_HEIGHT, 'tutorial_back.png');

      backPanel.anchor.set(0.5);
      backPanel.y -= backPanel.height * 0.48 - LU.TOP_OFFSET;

      gHelpPanel.add(backPanel);

      let button = imageLoader.sprite(LU.FULL_GAME_WIDTH * 0.5, LU.FULL_GAME_HEIGHT, 'button.png');
      button.y+=button.height;
      button.anchor.set(0.5);

      let textStype0 = {
        font: "50px Fresca",
        fill: '#ffffff',
        boundsAlignH: "center",
        boundsAlignV: "middle",
        align: "center",
        stroke: "#000000",
        strokeThickness: 8,
      };

      let continueTxt = this._game.add.text(0, 0, 'Continue', textStype0);
      continueTxt.anchor.set(0.5);
      button.addChild(continueTxt);

      let finger = imageLoader.sprite(button.width*0.5-40, button.height*0.5-40, 'hand.png');
      button.addChild(finger);

      this._game.add.tween(finger.scale).to({
        x: [1,0.8,1],
        y: [1,0.8,1],
      }, 1500, Phaser.Easing.Linear.None, true, 0, -1, false)

      gHelpPanel.add(button);


      gHelpPanel.x = -LU.FULL_GAME_WIDTH * 2;
      this._game.add.tween(gHelpPanel).to({
        x: LU.LEFT_OFFSET
      }, 400, Phaser.Easing.Sinusoidal.InOut).delay(600).start();

      let textStype1 = {
        font: "35px Fresca",
        fill: '#000000',
        boundsAlignH: "center",
        boundsAlignV: "middle",
        align: "center",
      };

      let infoTxt = this._game.add.text(105, -55, 'Hey! These fellas need\ndrinks. Make matches to fill\norders!', textStype1);
      infoTxt.addFontWeight('bold', 0);

      backPanel.addChild(infoTxt);

      infoTxt.anchor.set(0.5);
      this._gHelperPanel.add(gHelpPanel);

      this._helpPanelsTmp.push(gHelpPanel);
      if (cb) {
        this._game.time.events.add(1000, cb);
      }
    });
  }


  drawHelpPanel(targetSprite, text, leftOriented, cb) {
    leftOriented = true;
    this._game.time.events.add(this._game.time.timeToCall + 200, () => {
      let gHelpPanel = this._game.add.group();
      let backPanel = imageLoader.sprite(LU.FULL_GAME_WIDTH * 0.5, LU.FULL_GAME_HEIGHT * (LP(0.55,1)), 'tutorial_back.png');

      backPanel.anchor.set(0.5);
      backPanel.y -= backPanel.height * 0.48 - LU.TOP_OFFSET+6;

      gHelpPanel.add(backPanel);


      gHelpPanel.x = -LU.FULL_GAME_WIDTH * 2;
      this._game.add.tween(gHelpPanel).to({
        x: LU.LEFT_OFFSET
      }, 400, Phaser.Easing.Sinusoidal.InOut).delay(600).start();

      let textStype1 = {
        font: "35px Fresca",
        fill: '#000000',
        boundsAlignH: "center",
        boundsAlignV: "middle",
        align: "center",
      };

      let infoTxt = this._game.add.text(105, -55, 'Make this match!', textStype1);
      infoTxt.addFontWeight('bold', 0);

      backPanel.addChild(infoTxt);

      infoTxt.anchor.set(0.5);
      this._gHelperPanel.add(gHelpPanel);

      this._helpPanelsTmp.push(gHelpPanel);
      if (cb) {
        this._game.time.events.add(1000, cb);
      }
    });
  }

  removeFieldHelper(force = false, skipSpritesCheck = false) {

    if (!skipSpritesCheck && (!this._maskSprite || !this._arrow)) return;

    for (let t of this._cachedTweens) {
      t.stop();
      t.target.x = t.timeline[0].vStartCache.x;
      t.target.y = t.timeline[0].vStartCache.y;
      this._game.tweens.remove(t);
    }

    if (force) {
      this._maskSprite.destroy();

      return;
    }

    this._game.add.tween(this._maskSprite).to({
      alpha: 0
    }, 300, Phaser.Easing.Sinusoidal.Out, true, 0, 0, false).onComplete.add(()=> {
      this._maskSprite.destroy();
    });

    this._game.add.tween(this._arrow.scale).to({
      x: 0,
      y: 0
    }, 500, Phaser.Easing.Sinusoidal.Out, true, 0, 0, false).onComplete.add(()=> {
      this._maskSprite.destroy();
    });
  }

  removeCircleHighlight() {
    if (!this._circle) return;
    this._game.add.tween(this._circle).to({
      alpha: 0
    }, 300, Phaser.Easing.Sinusoidal.Out, true, 0, 0, false).onComplete.add(()=> {
      this._circle.destroy();
    });
  }

  removeHelperPanel(destroy = false) {

    if (this._helpPanelsTmp.length != 0) {
      let panel = this._helpPanelsTmp.pop();
      this._game.add.tween(panel).to({
        x: LU.RIGHT_OFFSET
      }, 400, Phaser.Easing.Sinusoidal.InOut, true, 0, 0, false).onComplete.add(()=> {
        //if (destroy)
        panel.destroy();
      });
    }
    else return;
  }


  removeAll() {
    this.removeFieldHelper();
    this.removeCircleHighlight();
    this.removeHelperPanel();
  }
}
