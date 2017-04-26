/*jshint -W083 */
/*jshint -W041 */

import LU from 'display/layout-utils';
import GameUI from 'objects/game-ui';
import GameTutorial from 'objects/game-tutorial';
import GameCTA from 'objects/game-cta';
import Utils from 'm3e/utils';

export default class GameView {
  constructor(game, view) {
    this._game = game;
    this._view = view;
    // Add groups in layer order
    this.createGroups('Background', 'Slots', 'BackgroundEffects', 'Chips', 'UI', 'Effects', 'Blockers', 'Cover', 'Tutorial', 'CTA');

    this.viewSettings = {
      slot: {
        width: 80,
        height: 80,
        viewScale: {x: LP(90, 90), y: LP(100, 75)},
        viewOffset: {x: LP(51, 51), y: LP(0, 0)},
        anchor: {x: LP(0.5, 0.5), y: LP(0.5, 0.5)}
      },
      chip: {
        width: 80,
        height: 80,
        viewScale: {x: 90, y: 90},
        viewOffset: {x: 50, y: 50},
      },
      border: {
        scaleFactor: 1,
        innerCornerOffset: {x: 0, y: 0},
        outerCornerOffset: {x: 0, y: 0},
      },
      ui: {
        viewScale: {x: LP(100, 100), y: LP(100, 100)},
        viewOffset: {x: LP(0, 50), y: LP(0, 0)},
        anchor: {x: LP(0, 0.5), y: LP(0, 0)}
      },
      backgorund: {
        viewScale: {x: LP(100, 100), y: LP(100, 75)},
        viewOffset: {x: LP(0, 50), y: LP(50, 0)},
        anchor: {x: LP(0, 0.5), y: LP(0.5, 0)}
      }
    };

    this.chip = ChipView;
    this.slot = SlotView;
    this.border = BorderView;
    this.effects = new Effects(game, this.gEffects, this.gChips);
    this._uiView = null;
    this._tutorialView = new GameTutorial(game, this.gTutorial, this.gSlots, this.viewSettings, this._uiView);
    this._ctaView = new GameCTA(game, this.gCTA);

    this.helperEventMain = null;

    this.helperEvent = [];
    this.hehlperTwn1 = [];
    this.hehlperTwn2 = [];
  }

  initUI(gameType) {
    this._uiView = new GameUI(this._game, this.gUI, gameType);
  }


  createGroups(...Args) {
    for (let arg of Args) {
      this['g' + arg] = this._game.add.group();
      this._view.add(this['g' + arg]);
    }
  }

  fitSlotsView() {
    this.fitGroup(this.gSlots, this.viewSettings.slot.viewScale, this.viewSettings.slot.viewOffset, true, true, this.viewSettings.slot.anchor);
  }

  fitUIView() {
    this.fitGroup(this.gUI, this.viewSettings.ui.viewScale, this.viewSettings.ui.viewOffset, true, false, this.viewSettings.ui.anchor);
    this.initBackgorund();

    const uiHeight = this.gUI.height;
    let newViewHeight = (LU.FULL_GAME_HEIGHT - uiHeight) * LP(0.85, 0.92);
    let newCentre = uiHeight + newViewHeight * 0.5;
    this.viewSettings.slot.viewOffset.y = ((newCentre + LU.getHeaderHeight()) / LU.FULL_GAME_HEIGHT * 100);
    this.viewSettings.slot.viewScale.y = (newViewHeight / LU.FULL_GAME_HEIGHT * 100);

    this._uiView.lateUIDraw();
  }

  initBackgorund() {
    this.gBackground.x = LU.LEFT_OFFSET;
    this.gBackground.y = this.gUI.height * 0.9 + LU.getHeaderHeight() + LU.TOP_OFFSET;
    let background = imageLoader.sprite(0, 0, 'background');
    background.scale.set(LU.FULL_GAME_WIDTH / background.width);

    this.gBackground.add(background);
  }

  fitChipsView() {
    this.gChips.x = this.gSlots.x;
    this.gChips.y = this.gSlots.y;
    this.gChips.scale.x = this.gSlots.scale.x;
    this.gChips.scale.y = this.gSlots.scale.y;

    this.gBackgroundEffects.x = this.gSlots.x;
    this.gBackgroundEffects.y = this.gSlots.y;
    this.gBackgroundEffects.scale.x = this.gSlots.scale.x;
    this.gBackgroundEffects.scale.y = this.gSlots.scale.y;

    this.gEffects.x = this.gSlots.x;
    this.gEffects.y = this.gSlots.y;
    this.gEffects.scale.x = this.gSlots.scale.x;
    this.gEffects.scale.y = this.gSlots.scale.y;
  }

  fitGroup(group, scaleFactor = {x: 100, y: 100}, offsetFactor = {
    x: 50,
    y: 50
  }, fitIntoFullView = false, cacheAsBitmap = false, anchor = {x: 0.5, y: 0.5}) {
    const viewWidth = fitIntoFullView ? LU.FULL_GAME_WIDTH : LU.BASE_WIDTH;
    const viewHeight = fitIntoFullView ? (LU.FULL_GAME_HEIGHT - LU.getHeaderHeight()) : LU.BASE_HEIGHT;
    group.x = (fitIntoFullView ? LU.LEFT_OFFSET : 0) + viewWidth * (offsetFactor.x * 0.01) - group.width * anchor.x;
    group.y = (fitIntoFullView ? LU.TOP_OFFSET + LU.getHeaderHeight() : 0) + viewHeight * (offsetFactor.y * 0.01) - group.height * anchor.y;

    let scaleX = (viewWidth * (scaleFactor.x * 0.01)) / group.width;
    let scaleY = (viewHeight * (scaleFactor.y * 0.01)) / group.height;
    let s = Math.min(scaleX, scaleY);
    group.scale.x = s;
    group.scale.y = s;

    group.x = (fitIntoFullView ? LU.LEFT_OFFSET : 0) + viewWidth * (offsetFactor.x * 0.01) - group.width * anchor.x;
    group.y = (fitIntoFullView ? LU.TOP_OFFSET + LU.getHeaderHeight() : 0) + viewHeight * (offsetFactor.y * 0.01) - group.height * anchor.y;
    group.cacheAsBitmap = cacheAsBitmap;
  }

  setToGroup(group, sprite) {
    let x = sprite.worldPosition.x;
    let y = sprite.worldPosition.y;
    group.add(sprite);

    let newPos = this._game.input.getLocalPosition(group, new Phaser.Point(x, y));
    sprite.x = newPos.x;
    sprite.y = newPos.y;
  }

  showHelpMove(possibleMoves, time) {
    this.hideHelpMoves();
    this.helperEventMain = null;
    this.helperEvent = [];
    this.hehlperTwn1 = [];
    this.hehlperTwn2 = [];

    this.helperEventMain = this._game.time.events.add(time * 1000, () => {
      this.helpChipsHighlight(possibleMoves);
    });
  }

  helpChipsHighlight(obj, slots = null) {
    const repeatTime = 3000;

    if (slots == null) {
      slots = [];
      let moveNumber = Utils.random(0, obj.length - 1);
      let findSlots = obj[moveNumber].result;
      slots.push({slot: obj[moveNumber].slot1});
      //slots.push({slot: obj[moveNumber].slot2})

      for (let s of findSlots) {
        if (!(s.slot.mI == obj[moveNumber].slot2.mI && s.slot.mJ == obj[moveNumber].slot2.mJ))
          slots.push(s);
      }

    }
    let event = this._game.time.events.add(repeatTime, () => {
      this.helpChipsHighlight(obj, slots);
    });

    this.helperEvent.push(event);

    let effectEvent = this._game.time.events.add(0, () => {

      for (let s of slots) {
        let slotView = s.slot.currentChip.view;
        let twn1 = this._game.add.tween(slotView).to({
          angle: [-15, 0, 15, 0, -15, 0, 15, 0]
        }, 1500, Phaser.Easing.Sinusoidal.InOut, true, 1, 0, false);
        let twn2 = this._game.add.tween(slotView.scale).to({
          x: [slotView.scale.x * 1.1, slotView.scale.x],
          y: [slotView.scale.y * 1.1, slotView.scale.y]
        }, 1500, Phaser.Easing.Sinusoidal.InOut, true, 1, 0, false);

        this.hehlperTwn1.push(twn1);
        this.hehlperTwn2.push(twn2);
      }
    });
    this.helperEvent.push(effectEvent);
  }

  hideHelpMoves() {

    if (this.helperEventMain !== null)
      this.helperEventMain.pendingDelete = true;

    if (this.helperEvent.length !== 0) {
      for (let e of this.helperEvent) {
        e.pendingDelete = true;
      }
    }

    this._game.time.events.clearPendingEvents();

    if (this.hehlperTwn1.length !== 0) {
      for (let t of this.hehlperTwn1) {
        t.target.alpha = 1;
        this._game.tweens.remove(t);
      }
    }

    if (this.hehlperTwn2.length !== 0) {
      for (let t of this.hehlperTwn2) {
        t.target.alpha = 1;
        this._game.tweens.remove(t);
      }
    }
  }
}

class Effects {
  constructor(game, group, backgroundEffectsGroup) {
    this._group = group;
    this._backGroup = backgroundEffectsGroup;
    this._game = game;
  }

  line(angle, size, slot) {

    slot.currentChip.isEffectShow = true;
    const color = slot.currentChip.color;
    let x = slot.currentChip.view.x;
    let y = slot.currentChip.view.y;

    let effectTime = 1500;

    let effect = imageLoader.sprite(x, y, 'burst.png');
    this._group.add(effect);
    effect.scale.set(0);
    effect.anchor.setTo(0.5, 0.5);

    let emitter = this._game.add.emitter(x, y, 6);
    emitter.makeParticles('assets', 'sparkles.png');
    emitter.setAlpha(1, 0.7, 1000);
    emitter.setScale(1.2, 0.1, 1.2, 0.1, 10000, Phaser.Easing.Quintic.Out);
    emitter.minParticleSpeed.setTo(-200, -250);
    emitter.maxParticleSpeed.setTo(200, 200);
    emitter.gravity = 100;
    this._group.add(emitter);

    emitter.start(true, 500, null, 6);


    this._game.add.tween(effect)
        .to({
          alpha: [0.8, 0],
        }, effectTime * 0.5, Phaser.Easing.Exponential.InOut, true);

    this._game.add.tween(effect.scale).to({
      x: 1.5,
      y: 1.5
    }, effectTime * 0.5, Phaser.Easing.Exponential.Out, true).onComplete.add(() => {
      effect.destroy();
    });

    //effect.blendMode = 1;

    let line_1 = imageLoader.sprite(x, y, color + '_streak.png');
    line_1.anchor.setTo(0.5, 0.5);
    //line_1.scale.setTo(0.8, 0);
    line_1.angle = angle;
    this._group.add(line_1);

    let line_2 = imageLoader.sprite(x, y, color + '_streak.png');
    line_2.anchor.setTo(0.5, 0.5);
    //  line_2.scale.setTo(0.8, 0);
    line_2.angle = angle + 180;
    this._group.add(line_2);

    // line_1.alpha = 0.6;
    // line_2.alpha = 0.6;

    line_1.blendMode = 1;
    line_2.blendMode = 1;

    // this._game.add.tween(line_1).to({
    //   alpha: 0
    // }, effectTime * 0.25, Phaser.Easing.Sinusoidal.In).delay(effectTime * 0.75).start();
    //
    // this._game.add.tween(line_2).to({
    //   alpha: 0
    // }, effectTime * 0.25, Phaser.Easing.Sinusoidal.In).delay(effectTime * 0.75).start();

    this._game.add.tween(line_1.anchor).to({
      y: 5

    }, effectTime, Phaser.Easing.Linear.InOut, true, 1, 0, false);

    this._game.add.tween(line_2.anchor).to({
      y: 5,
    }, effectTime, Phaser.Easing.Linear.InOut, true, 1, 0, false).onComplete.add(() => {

      line_1.destroy();
      line_2.destroy();
    });

    this._game.time.events.add(effectTime * 0.5, () => {
      slot.currentChip.isEffectShow = false;
    });
  }

  chipHighlight(slot) {
    return;
    // let x = slot.currentChip.view.x;
    // let y = slot.currentChip.view.y;
    // let x1 = slot.currentChip.mMoveSteps[0].x;
    // let y1 = slot.currentChip.mMoveSteps[0].y;
    //
    // let highlight = imageLoader.sprite(0, 0, 'chipBackHighlight.png');
    // highlight.anchor.set(0.5);
    // highlight.scale.set(1.1);
    //
    // slot.currentChip.view.add(highlight);
    // slot.currentChip.view.bringToTop(slot.currentChip.view._sprite);
    // this._backGroup.bringToTop(slot.currentChip.view);
    // let dx = x1 - x;
    // let dy = y1 - y;
    // highlight.update = () => {
    //   let curDistX = x1 - slot.currentChip.view.x;
    //   let curDistY = y1 - slot.currentChip.view.y;
    //   let timeY = dy > curDistY ? (dy / curDistY) : (curDistY / dy);
    //   let timeX = dx > curDistX ? (dx / curDistX) : (curDistX / dx);
    //
    //   timeX /= Math.max(1, slot.mI);
    //   timeY /= Math.max(1, slot.mJ);
    //   highlight.x = (dx - curDistX) * (-4 * Math.pow(timeX, 2) + 1.5 * timeX);
    //   highlight.y = (dy - curDistY) * (-4 * Math.pow(timeY, 2) + 1.5 * timeY);
    // };
    //
    // highlight.remove = () => {
    //   highlight.destroy();
    // };
    // return highlight;
  }

  colorBombEffect(slot, removedSlots) {
    //  if (slot.currentChip.isEffectShow == true) return;
    slot.currentChip.isEffectShow = true;
    const time = 1500;
    slot.currentChip.mIgnoreDestroyEffect = false;
    let startX = slot.currentChip.view.x;
    let startY = slot.currentChip.view.y;

    for (let s of removedSlots) {
      let x = s.slot.currentChip.view.x;
      let y = s.slot.currentChip.view.y;

      let width = Phaser.Math.distance(x, y, startX, startY);

      let bolt = imageLoader.sprite(startX, startY, `${width > 260 ? 'long' : 'short'}_01.png`);
      this._group.add(bolt);

      let scaleFactor = width / bolt.width;

      bolt.angle = Phaser.Math.radToDeg(Phaser.Math.angleBetween(startX, startY, x, y));
      bolt.scale.x = scaleFactor;
      bolt.anchor.setTo(0, 0.5);

      let boltFrameNames = Phaser.Animation.generateFrameNames(`${width > 260 ? 'long' : 'short'}_`, 1, 14, '.png', 2);
      boltFrameNames = boltFrameNames.concat(boltFrameNames.reverse());

      bolt.animations.add('splash', boltFrameNames, 30);
      bolt.animations.play('splash', Utils.random(20, 35), false, true);

      this._game.time.events.add((width > 260 ? 80 : 120), () => {
        if ((x != startX && y != startY) || (x == startX && y != startY) || (x != startX && y == startY)) {
          let splash = imageLoader.sprite(x, y, 'bolt_end_splash.png');
          splash.anchor.set(0.5);
          this._group.add(splash);
          splash.scale.set(1);

          this._game.time.events.add((width > 260 ? 700 : 750), () => {
            splash.destroy();
          });
        }
      });
    }

    if (removedSlots.length > 1) {
      let bolt_splash = imageLoader.sprite(startX, startY, 'bolt_splash.png');

      bolt_splash.anchor.set(0.5);
      this._group.add(bolt_splash);
      bolt_splash.scale.set(1);

      this._game.add.tween(bolt_splash.scale).to({
        x: 1,
        y: 1
      }, 100, Phaser.Easing.Sinusoidal.Out, true, 0, 0, false);

      this._game.add.tween(bolt_splash.scale).to({
        x: 0,
        y: 0
      }, 100, Phaser.Easing.Sinusoidal.Out, true, 1300, 0, false).onComplete.add(() => {
        bolt_splash.destroy();
      });
    }

    this._game.time.events.add(time, () => {
      slot.currentChip.isEffectShow = false;
    });
  }

  bombEffect(size, slot) {
    const effectTime = 800;
    slot.currentChip.isEffectShow = true;
    let x = slot.currentChip.view.x;
    let y = slot.currentChip.view.y;

    let flameEffect = this._game.add.emitter(x, y, 30);
    flameEffect.makeParticles('assets', 'flame.png');
    flameEffect.gravity = 0;
    flameEffect.setAlpha(1, 0.1, 5000);
    let speed = 300;

    flameEffect.minParticleSpeed.setTo(-speed, -speed);
    flameEffect.maxParticleSpeed.setTo(speed, speed);
    flameEffect.setScale(1, 0.5, 1, 0.5, 15000, Phaser.Easing.Quintic.Out);
    this._group.add(flameEffect);
    flameEffect.start(true, 800, null, 30);


    // for(let i=0; i<30;i++)
    // {
    //   let flame = imageLoader.sprite(x,y,'flame.png')
    //   flame.anchor.set(0,0.5)
    //   this._group.add(flame);
    //   flame.angle = i*(180/15);
    //   this._game.add.tween(flame.anchor).to({
    //     y: utils.random(1.1,2.5,)
    //   }, effectTime, Phaser.Easing.Linear.InOut, true, utils.random(0,100), 0, false);
    //   this._game.add.tween(flame).to({
    //     alpha: [1,1,0]
    //   }, effectTime, Phaser.Easing.Linear.InOut, true, 0, 0, false).onComplete.add(()=>{
    //     flame.destroy();
    //   });
    // }
    let effect = imageLoader.sprite(x, y, 'burst.png');
    this._group.add(effect);
    effect.scale.set(0);
    effect.anchor.setTo(0.5, 0.5);
    this._game.add.tween(effect)
        .to({
          alpha: [0.8, 0],
        }, effectTime, Phaser.Easing.Exponential.InOut, true);

    this._game.add.tween(effect.scale).to({
      x: 1.5,
      y: 1.5
    }, effectTime, Phaser.Easing.Exponential.Out, true).onComplete.add(() => {
      effect.destroy();
    });

    this._game.time.events.add(effectTime, () => {
      slot.currentChip.isEffectShow = false;
      flameEffect.destroy();

    });
  }

  // pawDestroy(slot, foxChip) {
  //   // const effectTime = 1000;
  //   slot.currentChip.mIgnoreDestroyEffect = true;
  //   slot.currentChip.isEffectShow = true;
  //
  //   let chipView = slot.currentChip.view;
  //   this._group.add(chipView);
  //
  //   let targetView = foxChip.view;
  //   let targetX = targetView.x;
  //   let targetY = targetView.y;
  //
  //   let twnTime = 1000 * Utils.random(0.9, 1.1);
  //
  //   let twn = this._game.add.tween(chipView).to({
  //     x: [targetX + LP(200, (targetX - chipView.x > 0 ? 100 : -150)), targetX],
  //     y: [targetY + LP((targetY - chipView.y > 0 ? 100 : -100), 150), targetY],
  //   }, twnTime, Phaser.Easing.Linear.None, true);
  //   twn.interpolation(Phaser.Math.bezierInterpolation);
  //   twn.start();
  //
  //   this._game.add.tween(chipView.scale).to({
  //     x: [2, 1],
  //     y: [2, 1],
  //   }, twnTime, Phaser.Easing.Sinusoidal.Out, true, twnTime * 0.6, 0, false);
  //
  //   twn.onComplete.add(() => {
  //     targetView.setFoxHappy();
  //     chipView.destroy();
  //   });
  //
  //   this._game.time.events.add(twnTime * 0.8, () => {
  //     if (slot.currentChip != 'no_chip')
  //       slot.currentChip.isEffectShow = false;
  //   });
  // }
}

class ChipView extends Phaser.Group {
  constructor(game, group, effectsGroup, chip, viewSettings, gameView) {
    super(game);
    this.debugMode = ChipView.DEBUG_MODE;
    this._gameView = gameView;
    this._chip = chip;
    let spriteName = '';
    this.timeEvents = [];
    this.tweenEvents = [];

    spriteName = `chip_${chip.mColor}_${chip.mType}.png`;

    this._sprite = imageLoader.sprite(0, 0, spriteName);
    this.x = chip.mI * viewSettings.slot.width;
    this.y = chip.mJ * viewSettings.slot.height;
    this.add(this._sprite);
    this._chip = chip;
    this._viewSettings = viewSettings;
    this._game = game;
    this._group = group;
    this._effectsGroup = effectsGroup;
    this._sprite.anchor.setTo(0.5, 1);
    this._sprite.y += this._sprite.height * 0.5;
    this.x += this._viewSettings.slot.width * 0.5;
    this.y += this._viewSettings.slot.height * 0.5;
    this.scale.x = this._viewSettings.chip.viewScale.x * 0.01;
    this.scale.y = this._viewSettings.chip.viewScale.y * 0.01;

    this._group.add(this);

    if (this.debugMode) {
      this.textStyle = {
        font: "30px Luckiest Guy",
        fill: '#000000',
        stroke: "#ffffff",
        strokeThickness: 3,
        boundsAlignH: "center",
        boundsAlignV: "middle"
      };
      this.initDebugUI();
    }
  }

  destroyEffect(cb, targetRecipe = false, delayFactor = 0) {

    if (this._chip.type == 6) {
      cb();
      return;
    }

    if (this._viewSettings.useEffects) {
      let emitter = this._game.add.emitter(this.x, this.y, 6);
      emitter.makeParticles('assets', 'slice_' + this._chip.color + '_1.png');
      emitter.setAlpha(1, 0.7, 1000);
      emitter.setScale(1.2, 0.1, 1.2, 0.1, 10000, Phaser.Easing.Quintic.Out);
      emitter.minParticleSpeed.setTo(-100, -150);
      emitter.maxParticleSpeed.setTo(100, 100);
      emitter.gravity = 300;
      this._effectsGroup.add(emitter);

      emitter.start(true, 500, null, 6);
    }
    if (targetRecipe !== false) {
      let targetView = this._gameView._uiView.getRecipeView(targetRecipe);
      let targetX = targetView.x;
      let targetY = targetView.y;

      let x = this._sprite.worldPosition.x;
      let y = this._sprite.worldPosition.y;

      let newPos = this._game.input.getLocalPosition(this._gameView.gUI, new Phaser.Point(x, y));


      for (let i = 0; i < 5; i++) {
        this.game.time.events.add(i * 200, ()=> {
          let bubble1 = imageLoader.sprite(newPos.x, newPos.y, this._chip.color + '_bub_' + utils.random(1, 2) + '.png');
          bubble1.scale.set(utils.random(0.8, 1.5))
          this._gameView.gUI.add(bubble1);
          bubble1.anchor.set(0.5);
          bubble1.y -= this._sprite.height * 0.5;

          let twnTime = 800 * Math.max(0.15, 1 - 0.15 * delayFactor);

          let twn = this._game.add.tween(bubble1).to({
            x: [targetX + LP(200, (targetX - bubble1.x > 0 ? 150 : -150)) + utils.random(-100, 100), targetX],
            y: [targetY + LP((targetY - bubble1.y > 0 ? 150 : -150), 200) + utils.random(-50, 50), targetY],
          }, twnTime, Phaser.Easing.Linear.None, true);
          twn.interpolation(Phaser.Math.bezierInterpolation);
          twn.start();

          this._game.add.tween(bubble1.scale).to({
            x: 0,
            y: 0
          }, twnTime * 0.1, Phaser.Easing.Sinusoidal.Out, true, twnTime * 0.9, 0, false);
          if (i == 0) {
            twn.onComplete.add(() => {
              this._gameView._uiView.decreceRecipe(targetRecipe);
              if (this.debugMode && this.debugTxt) {
                this.debugTxt.destroy();
              }
              this.destroy();
            });
          }
        });
      }
    }

    let circle = imageLoader.sprite(this.x, this.y, `${this._chip.color}_1.png`);
    circle.anchor.set(0.5);

    // let animationNames = Phaser.Animation.generateFrameNames(`${this._chip.color}_`, 1, 3, '.png', 1);
    // animationNames = animationNames.reverse();
    // console.log(animationNames)
    // circle.animations.add('splash', animationNames, 30);
    // circle.animations.play('splash', 10, false, true);

    this._game.add.tween(circle.scale).to({
      x: 1.5,
      y: 1.5
    }, 500, Phaser.Easing.Sinusoidal.InOut, true)

    this._game.add.tween(circle).to({
      alpha: 0
    }, 500, Phaser.Easing.Sinusoidal.InOut, true)

    this._effectsGroup.add(circle);
    this._game.add.tween(this.scale).to({
      x: 0,
      y: 0
    }, 1000, Phaser.Easing.Sinusoidal.InOut, true).onComplete.add(() => {
      if (this.debugMode && this.debugTxt) {
        this.debugTxt.destroy();
      }
      this.destroy();
    });


    let starEmitter = null;
    // if (this._viewSettings.useEmitters) {
    //   starEmitter = this._game.add.emitter(this.x, this.y, 15);
    //   starEmitter.makeParticles('assets', 'startEffect.png');
    //   starEmitter.setAlpha(0.7, 0.1, 1000);
    //   starEmitter.minParticleSpeed.setTo(-200, -200);
    //   starEmitter.maxParticleSpeed.setTo(200, 200);
    //   starEmitter.setScale(0.4, 0.3, 0.4, 0.3, 10000, Phaser.Easing.Quintic.Out);
    //   starEmitter.start(true, 500, null, 15);
    //   this._effectsGroup.add(starEmitter);
    //
    // }

    this._game.time.events.add(300, () => {
      cb();
      // if (this._viewSettings.useEmitters)
      //   starEmitter.destroy();
    });
  }

  setVisible(value) {
    this._sprite.visible = value;
  }

  specialDestroyEffect(targetPos, cb) {
    //this.destroyEffect(cb);
    let targetTime = targetPos.x.length * 100;
    let targetX = targetPos.x.map((x) => {
      return x * this._viewSettings.slot.width + this._viewSettings.slot.width * 0.5;
    });
    let targetY = targetPos.y.map((x)=> {
      return x * this._viewSettings.slot.height + this._viewSettings.slot.height * 0.5;
    });
    this._game.add.tween(this).to({
      x: targetX,
      y: targetY,
      alpha: 0
    }, targetTime, Phaser.Easing.Linear.None, true).onComplete.add(()=> {
      this.destroy();
    }, this);
    // this._game.add.tween(this.scale).to({
    //   x: 0,
    //   y: 0
    // }, targetTime, Phaser.Easing.Linear.None, true).start();
    this._game.time.events.add(targetTime, cb);
  }

  setNewType(cb) {
    let nativeScale = this.scale.x;
    // if (this._viewSettings.useEffects) {
    //   let effect = imageLoader.sprite(this.x, this.y, 'splash.png');
    //   this._group.add(effect);
    //   effect.scale.set(0);
    //   effect.anchor.setTo(0.5, 0.5);
    //   this._game.add.tween(effect)
    //       .to({
    //         alpha: 0,
    //       }, 600, Phaser.Easing.Sinusoidal.InOut, true);
    //
    //   this._game.add.tween(effect.scale).to({
    //     x: this._viewSettings.chip.viewScale.x * 0.01,
    //     y: this._viewSettings.chip.viewScale.y * 0.01,
    //   }, 300, Phaser.Easing.Sinusoidal.InOut, true).onComplete.add(() => {
    //     effect.destroy();
    //   });
    // }
    let emitter = null;
    // if (this._viewSettings.useEmitters) {
    //   let emitter = this._game.add.emitter(this.x, this.y, 5);
    //   emitter.makeParticles('assets', 'startEffect.png');
    //   emitter.alpha = 0.8;
    //   emitter.gravity = -50;
    //   this._group.add(emitter);
    //
    //   emitter.start(true, 500, null, 5);
    // }
    this._game.add.tween(this.scale).to({
      x: 0,
      y: 0
    }, 100, Phaser.Easing.Sinusoidal.InOut, true).onComplete.add(() => {
      this._sprite.frameName = `chip_${this._chip.mColor}_${this._chip.mType}.png`;
      this._game.add.tween(this.scale).to({
        x: nativeScale,
        y: nativeScale
      }, 200, Phaser.Easing.Linear.None, true);
    });
    this._game.time.events.add(300, () => {
      cb();
      if (emitter && this._viewSettings.useEmitters)
        emitter.destroy();
    });
  }

  getX() {
    return (this.x - this._viewSettings.slot.width * 0.5) / this._viewSettings.slot.width;
  }

  setX(x) {
    this.x = x * this._viewSettings.slot.width + this._viewSettings.slot.width * 0.5;
  }

  getY() {
    return (this.y - this._viewSettings.slot.height * 0.5) / this._viewSettings.slot.height;
  }

  setY(y) {
    this.y = y * this._viewSettings.slot.height + this._viewSettings.slot.height * 0.5;
  }

  refreshColor() {
    if (this._chip.mType === 7) return;
    if (this._chip.mType === 8) return;
    this._game.add.tween(this.scale).to({
      x: 0,
      y: 0
    }, 200, Phaser.Easing.Sinusoidal.InOut, true).onComplete.add(() => {
      this._sprite.frameName = `chip_${this._chip.mColor}_${this._chip.mType }.png`;
      this._game.add.tween(this.scale).to({
        x: this._viewSettings.chip.viewScale.x * 0.01,
        y: this._viewSettings.chip.viewScale.y * 0.01
      }, 200, Phaser.Easing.Sinusoidal.InOut, true);
    });

    if (this._chip.type === 6 && this._viewSettings.useEmitters) {
      let tintColor = "0xffffff";

      switch (this._chip.color) {
        case 0:
          tintColor = "0x00e9f6"; //blue
          break;
        case 1:
          tintColor = "0x92fe8d"; //green
          break;
        case 2:
          tintColor = "0xf0a3ff"; //violet
          break;
        case 3:
          tintColor = "0xffafab"; //red
          break;
        case 4:
          tintColor = "0xffffac"; //yellow
          break;
      }

      this._shine.tint = tintColor;
    }
  }

  moveFoxTo(target, cb) {

    this._sprite.animations.play('move', 29).onComplete.add(() => {
      this._sprite.animations.play('idle', 11, true);
    });
    this._game.add.tween(this).to({
      x: target.view.x,
      y: target.view.y
    }, 600, Phaser.Easing.Sinusoidal.Out, true, 1, 0, false).onComplete.add(() => {
      cb();
    });
  }

  setFoxHappy() {
    this._sprite.animations.play('howl', 20).onComplete.add(() => {
      this._sprite.animations.play('happy1', 8).onComplete.add(() => {
        this._sprite.animations.play('happy2', 12, true);
      });
    });
  }

  moveToSlot(target, cb) {

    if (this._chip.type == 8) {
      this._game.add.tween(this.effect1).to({
        x: target.view.x,
        y: target.view.y
      }, 600, Phaser.Easing.Sinusoidal.Out, true, 1, 0, false);
      this._game.add.tween(this.effect2).to({
        x: target.view.x,
        y: target.view.y
      }, 600, Phaser.Easing.Sinusoidal.Out, true, 1, 0, false);
    }
    this._game.add.tween(this).to({
      x: target.view.x,
      y: target.view.y
    }, 600, Phaser.Easing.Sinusoidal.Out, true, 1, 0, false).onComplete.add(() => {
      cb();
    });
  }

  updateView() {
    if (this._chip.mType === 7) return;
    if (this._chip.mType === 8) return;
    this._sprite.frameName = `chip_${this._chip.mColor}_${this._chip.mType }.png`;
  }

  shake() {
    if (this.game.tweens.isTweening(this)) return;
    this._game.add.tween(this).to({
      angle: [-15, 0, 15, 0, -15, 0, 15, 0]
    }, 1500, Phaser.Easing.Sinusoidal.InOut, true, 1, 0, false);
    this._game.add.tween(this.scale).to({
      x: [this.scale.x * 1.1, this.scale.x],
      y: [this.scale.y * 1.1, this.scale.y]
    }, 1500, Phaser.Easing.Sinusoidal.InOut, true, 1, 0, false);
  }

  maximize() {

    for (let twn of this.tweenEvents) {
      this._game.tweens.remove(twn);

    }

    for (let te of this.timeEvents) {
      this._game.time.events.remove(te);
    }

    let sprites = [this.effect1, this.effect2, this,];
    for (let s of sprites) {
      this._game.add.tween(s.scale).to({
        x: 3,
        y: 3
      }, 1000, Phaser.Easing.Sinusoidal.InOut, true, 1, 0, false);
      this._game.add.tween(s).to({
        x: this.x * 0.5 + this.width * 0.5,
        y: this.x * 0.5 + this.height * 0.5
      }, 1000, Phaser.Easing.Sinusoidal.InOut, true, 1, 0, false);
      this._effectsGroup.bringToTop(s);
    }
  }

  update() {
    if (this.debugMode && this.debugTxt) {
      this.debugTxt.x = this.x;
      this.debugTxt.y = this.y;
      this.debugTxt.text = `${this._chip.mCanMatch}`;
      this._group.bringToTop(this.debugTxt);
    }
  }

  initDebugUI() {

    this.debugTxt = this._game.add.text(this._chip.type, this._chip.color, '0', this.textStyle);
    this.debugTxt.anchor.set(0.5);
    this._group.add(this.debugTxt);
  }
}

class SlotView extends Phaser.Sprite {
  constructor(game, group, slot, viewSettings) {
    super(game, slot.mI * viewSettings.slot.width, slot.mJ * viewSettings.slot.height, 'assets', `boardTile_${slot.mColorType + 1}.png`);
    this.alpha = 1;
    group.add(this);

    switch (slot.type) {
      case 3:
        this.frameName = 'carpet.png';
        break;
      case 4:
        this.frameName = 'carpet.png';
        let carpetLeftBorder = imageLoader.sprite(this.x, this.y, 'carpet_side.png');
        group.add(carpetLeftBorder);
        break;
      case 5:
        this.frameName = 'carpet.png';
        let carpetRightBorder = imageLoader.sprite(this.x + viewSettings.slot.width, this.y, 'carpet_side.png');
        carpetRightBorder.scale.setTo(-1, 1);
        group.add(carpetRightBorder);
        break;
      case 6:
        this.frameName = 'carpet_corner.png';

        break;
      case 7:
        this.frameName = 'carpet_corner.png';
        this.anchor.set(0.5);
        this.angle = -180;
        this.x += this.width * 0.5;
        this.y += this.height * 0.5;
        break;
      case 8:
        this.frameName = 'carpet.png';
        this.anchor.set(0.5);
        this.angle = -180;
        this.x += this.width * 0.5;
        this.y += this.height * 0.5;
        break;
      case 9:
        this.frameName = 'carpet.png';
        this.anchor.set(0.5);
        this.angle = -180;
        this.x += this.width * 0.5;
        this.y += this.height * 0.5;
        let carpetRightBorderReversed = imageLoader.sprite(this.x + viewSettings.slot.width * 0.5, this.y, 'carpet_side.png');
        carpetRightBorderReversed.scale.setTo(-1, 1);
        carpetRightBorderReversed.anchor.set(0.5);
        group.add(carpetRightBorderReversed);
        break;
    }

  }
}

class BorderView extends Phaser.Sprite {
  constructor(game, group, border, viewSettings) {
    super(game, 0, 0, 'assets', `left.png`);

    switch (border.mType) {
      case 'right':
        this.frameName = 'left.png';
        this.scale.x *= -1;
        this.anchor.setTo(1, 0);
        this.x = (border.parentSlot.mI + 1) * viewSettings.slot.width - 1;
        this.y = border.parentSlot.mJ * viewSettings.slot.height;
        break;
      case 'left':
        this.frameName = 'left.png';
        this.anchor.setTo(1, 0);
        this.x = (border.parentSlot.mI) * viewSettings.slot.width + 1;
        this.y = border.parentSlot.mJ * viewSettings.slot.height;
        break;
      case 'top':
        this.frameName = 'up.png';
        //this.angle = 90;
        this.anchor.setTo(1, 1);
        this.x = (border.parentSlot.mI + 1) * viewSettings.slot.width;
        this.y = border.parentSlot.mJ * viewSettings.slot.height + 1;
        break;
      case 'bottom':
        this.frameName = 'up.png';
        //  this.angle = 90;
        this.scale.y *= -1;
        this.anchor.setTo(1, 1);
        this.x = (border.parentSlot.mI + 1) * viewSettings.slot.width;
        this.y = (border.parentSlot.mJ + 1) * viewSettings.slot.height - 1;
        break;
      case 'top-left':
        this.frameName = 'inner_corner.png';
        this.anchor.setTo(1, 1);
        this.x = (border.parentSlot.mI) * viewSettings.slot.width + viewSettings.border.innerCornerOffset.x;
        this.y = (border.parentSlot.mJ) * viewSettings.slot.height + viewSettings.border.innerCornerOffset.y;
        break;
      case 'top-right':
        this.frameName = 'inner_corner.png';
        this.scale.x *= -1;
        this.anchor.setTo(1, 1);
        this.x = (border.parentSlot.mI + 1) * viewSettings.slot.width - viewSettings.border.innerCornerOffset.x;
        this.y = (border.parentSlot.mJ) * viewSettings.slot.height + viewSettings.border.innerCornerOffset.y;
        break;
      case 'bottom-left':
        this.frameName = 'inner_corner.png';
        // this.angle = -90;
        this.scale.y *= -1;
        this.anchor.setTo(1, 1);
        this.x = (border.parentSlot.mI) * viewSettings.slot.width + viewSettings.border.innerCornerOffset.x;
        this.y = (border.parentSlot.mJ + 1) * viewSettings.slot.height - viewSettings.border.innerCornerOffset.y;
        break;
      case 'bottom-right':
        this.frameName = 'inner_corner.png';
        //this.angle = 180;
        this.scale.x *= -1;
        this.scale.y *= -1;
        this.anchor.setTo(1, 1);
        this.x = (border.parentSlot.mI + 1) * viewSettings.slot.width - viewSettings.border.innerCornerOffset.x;
        this.y = (border.parentSlot.mJ + 1) * viewSettings.slot.height - viewSettings.border.innerCornerOffset.y;
        break;
      case 'top-left-outer':
        this.frameName = 'outer_corner.png';
        this.anchor.setTo(1, 0);
        this.angle = 90;
        this.x = (border.parentSlot.mI) * viewSettings.slot.width - viewSettings.border.outerCornerOffset.x;
        this.y = (border.parentSlot.mJ) * viewSettings.slot.height + viewSettings.border.outerCornerOffset.y;
        break;
      case 'top-right-outer':
        this.frameName = 'outer_corner.png';
        this.angle = 180;
        this.anchor.setTo(1, 0);
        this.x = (border.parentSlot.mI + 1) * viewSettings.slot.width + viewSettings.border.outerCornerOffset.x;
        this.y = (border.parentSlot.mJ) * viewSettings.slot.height - viewSettings.border.outerCornerOffset.y;
        break;
      case 'bottom-left-outer':
        this.frameName = 'outer_corner.png';
        this.angle = 0;
        this.anchor.setTo(1, 0);
        this.x = (border.parentSlot.mI) * viewSettings.slot.width + viewSettings.border.outerCornerOffset.x;
        this.y = (border.parentSlot.mJ + 1) * viewSettings.slot.height + viewSettings.border.outerCornerOffset.y;
        break;
      case 'bottom-right-outer':
        this.frameName = 'outer_corner.png';
        this.angle = -90;
        this.anchor.setTo(1, 0);
        this.x = (border.parentSlot.mI + 1) * viewSettings.slot.width + viewSettings.border.outerCornerOffset.x;
        this.y = (border.parentSlot.mJ + 1) * viewSettings.slot.height - viewSettings.border.outerCornerOffset.y;
        break;
      case 'top-left-outer-skew':
        this.frameName = 'outer_corner.png';
        this.angle = 0;
        this.anchor.setTo(1, 0);
        this.x = (border.parentSlot.mI) * viewSettings.slot.width + viewSettings.border.outerCornerOffset.x;
        this.y = (border.parentSlot.mJ) * viewSettings.slot.height + viewSettings.border.outerCornerOffset.y;
        break;
      case 'top-right-outer-skew':
        this.frameName = 'outer_corner.png';
        this.angle = -90;
        this.anchor.setTo(1, 0);
        this.x = (border.parentSlot.mI + 1) * viewSettings.slot.width + viewSettings.border.outerCornerOffset.x;
        this.y = (border.parentSlot.mJ) * viewSettings.slot.height + viewSettings.border.outerCornerOffset.y;
        break;
      case 'bottom-left-outer-skew':
        this.frameName = 'outer_corner.png';
        this.angle = 90;
        this.anchor.setTo(1, 0);
        this.x = (border.parentSlot.mI) * viewSettings.slot.width - viewSettings.border.outerCornerOffset.x;
        this.y = (border.parentSlot.mJ + 1) * viewSettings.slot.height - viewSettings.border.outerCornerOffset.y;
        break;
      case 'bottom-right-outer-skew':
        this.frameName = 'outer_corner.png';
        this.angle = 180;
        this.anchor.setTo(1, 0);
        this.x = (border.parentSlot.mI + 1) * viewSettings.slot.width + viewSettings.border.outerCornerOffset.x;
        this.y = (border.parentSlot.mJ + 1) * viewSettings.slot.height - viewSettings.border.outerCornerOffset.y;
        break;
      default:
        break;
    }

    this.scale.x *= viewSettings.border.scaleFactor;
    this.scale.y *= viewSettings.border.scaleFactor;
    this.alpha = 1;
    group.add(this);
  }

  onIndexUpdate() {
  }
}

ChipView.DEBUG_MODE = false;
