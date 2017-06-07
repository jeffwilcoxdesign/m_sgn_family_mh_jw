/*jshint -W041 */
/*jshint -W083 */

import LU from 'display/layout-utils';

import Globals from 'kernel/globals';


export default class GameUI {
  constructor(game, view, params) {
    this._game = game;
    this._view = view;
    this._recipesInfo = params.recipesInfo;
    this._gUI = this._game.add.group();
    this._view.add(this._gUI);
    this._scoreTmp = 0;
    this.totalRecipesCount = 0;
    this.currentRecipesCount = 0;


    this.recipesTextStyle = {
      font: "30px Fresca",
      fill: '#000000',
      boundsAlignH: "center",
      boundsAlignV: "middle",
      align: "center",
    };

    this.movesTextStyle = {
      font: "30px Fresca",
      fill: '#ffffff',
      boundsAlignH: "center",
      boundsAlignV: "middle",
      align: "center",
    };

    this.movesCountTextStyle = {
      font: "70px Fresca",
      fill: '#000000',
      boundsAlignH: "center",
      boundsAlignV: "middle",
      stroke: "#070305",
      strokeThickness: 8,
      align: "center",
    };


    this.recipeItems = [];
    LP(this.initUILandscape, this.initUIPortrait).apply(this);
    this.textRedrawTimes = 0;
    this._game.time.events.add(100, ()=> {
      this.redrawAllTextData();
    });
  }

  redrawAllTextData() {
    for (let item in this._gUI.children) {
      if (this._gUI.children[item].text != null) {
        this._gUI.children[item].addFontStyle('normal');
      }
    }
    if (++this.textRedrawTimes < 3)
      this._game.time.events.add(1000, ()=> {
        this.redrawAllTextData();
      });
  }

  updateMoves(value) {
    if (!this.movesText) return;
    this.movesText.text = value;
  }

  updateScore(value) {
    //this.scoreFill.angle = 0;
  }

  initUILandscape() {
    this.uiPanel = imageLoader.sprite(0, 0, 'topBackground');
    // let scaleFactor =  LU.FULL_GAME_WIDTH / this.uiPanel.width;
    this.uiPanel.nativeWidth = this.uiPanel.width;
    this.uiPanel.width = LU.FULL_GAME_WIDTH;
    this._gUI.add(this.uiPanel);


    let xPositions = [
      [this.uiPanel.width * 0.5],
      [this.uiPanel.width * 0.3, this.uiPanel.width * 0.7],
      [this.uiPanel.width * 0.5, this.uiPanel.width * 0.2, this.uiPanel.width * 0.8]
    ];

    this.peter = imageLoader.sprite(this.uiPanel.width * 0.5, 300, 'peter_normal.png');
    this._game.add.tween(this.peter).to({
      angle: [-5, 0, 5, 0]
    }, 5000, Phaser.Easing.Linear.None, true, 0, -1, false);

    this.peter.anchor.setTo(0.5, 1);
    this._gUI.add(this.peter);

    if (this._recipesInfo.length > 1) {
      this.stewie = imageLoader.sprite(this.uiPanel.width * 0.2, 280, 'stewie_normal.png');
      this.stewie.anchor.setTo(0.5, 1);
      this._gUI.add(this.stewie);

      this._game.add.tween(this.stewie).to({
        angle: [-4, 0, 4, 0]
      }, 4000, Phaser.Easing.Linear.None, true, 750, -1, false);
    }


    if (this._recipesInfo.length >= 3) {
      this.louis = imageLoader.sprite(this.uiPanel.width * 0.8, 300, 'lois_normal.png');
      this.louis.anchor.setTo(0.5, 1);
      this._gUI.add(this.louis);

      this._game.add.tween(this.louis).to({
        angle: [-3, 0, 3, 0]
      }, 3500, Phaser.Easing.Linear.None, true, 500, -1, false);
    }

    this.counter = imageLoader.sprite(0, this.uiPanel.height, 'counter.png');
    this.counter.height *= 0.65;
    this.counter.x = LU.FULL_GAME_WIDTH * 0.5 - this.counter.width * 0.5;
    this._gUI.add(this.counter);


    this.stewie.drink = (glass)=> {
      this.stewie.frameName = 'stewie_drink.png';
      this.stewie.addChild(glass);
      this._game.tweens.removeFrom(this.stewie);
      this._game.add.tween(this.stewie.scale).to({
        x: [1.1, 1.05, 1.07, 1],
        y: [1.1, 1.05, 1.07, 1]
      }, 1200, Phaser.Easing.Linear.None, true, 0, 0, false).onComplete.add(()=> {
        this._game.add.tween(this.stewie).to({
          angle: 75,
          //  y: this.stewie.y+50,
          alpha: [1, 1, 0],
        }, 1000, Phaser.Easing.Linear.None, true, 0, 0, false);
      });
      glass.angle = 95;
      glass.scale.set(0.5);
      glass.y = -70;
      glass.x = -30;
    };

    this.louis.drink = (glass)=> {
      this.louis.frameName = 'lois_drink.png';
      this.louis.addChild(glass);

      this._game.tweens.removeFrom(this.louis);
      this._game.add.tween(this.louis.scale).to({
        x: [1.1, 1.05, 1.07, 1],
        y: [1.1, 1.05, 1.07, 1]
      }, 1200, Phaser.Easing.Linear.None, true, 0, 0, false).onComplete.add(()=> {
        this._game.add.tween(this.louis).to({
          angle: 75,
          //   y: this.stewie.y+50
          alpha: [1, 1, 0],
        }, 1000, Phaser.Easing.Linear.None, true, 0, 0, false);
      });
      glass.angle = 100;
      glass.scale.set(0.7);
      glass.y = -175;
      glass.x = -40;
    };

    this.peter.drink = (glass)=> {
      this.peter.frameName = 'peter_drink.png';
      this.peter.addChild(glass);

      this._game.tweens.removeFrom(this.peter);
      this._game.add.tween(this.peter.scale).to({
        x: [1.1, 1.05, 1.07, 1],
        y: [1.1, 1.05, 1.07, 1]
      }, 1200, Phaser.Easing.Linear.None, true, 0, 0, false).onComplete.add(()=> {
        this._game.add.tween(this.peter).to({
          angle: 60,
          alpha: [1, 1, 0],
        }, 1000, Phaser.Easing.Linear.None, true, 0, 0, false);
      });
      glass.angle = 95;
      glass.scale.set(0.8);
      glass.y = -240;
      glass.x = -50;
    };

    const xPos = [this.uiPanel.width * 0.2, this.uiPanel.width * 0.5, this.uiPanel.width * 0.8];
    const topOffset = 270;
    // const leftOffset = 140 +  LU.FULL_GAME_WIDTH*0.5 - counter.width*0.5;
    // const cellW = 220;
    const rCountOffsetX = 27;
    const rCountOffsetY = 5;

    let colours = ['#107fff', '#34a316', '#9a22d5', '#cd0110', '#ac6800', '#f64c01'];
    let heroesToDrink = [this.stewie, this.peter, this.louis];
    for (let i = 0; i < this._recipesInfo.length; i++) {
      let img = imageLoader.sprite(xPos[i], topOffset, `chip_${this._recipesInfo[i].color}_0.png`);
      img.anchor.set(0.5);
      img.scale.set(0.9);
      this._gUI.add(img);

      let score_disc = imageLoader.sprite(xPos[i] + rCountOffsetX, topOffset + rCountOffsetY, `score_disc.png`);
      score_disc.x += 15;
      score_disc.y += 15;
      score_disc.anchor.set(0.5);
      this._gUI.add(score_disc);

      let check = imageLoader.sprite(xPos[i] + rCountOffsetX, topOffset + rCountOffsetY, `check.png`);
      check.x += 15;
      check.y += 15;
      check.anchor.set(0.5);
      check.scale.set(0);
      this._gUI.add(check);
      console.log("addted text")
      let count = this._game.add.text(0, 2, this._recipesInfo[i].count, this.recipesTextStyle);
      count.fill = colours[this._recipesInfo[i].color];
      count.anchor.setTo(0.5, 0.5);

      this.totalRecipesCount += this._recipesInfo[i].count;
      score_disc.addChild(count);

      this.recipeItems.push({
        img: img,
        text: count,
        check: check,
        heroes: heroesToDrink[i]
      });
    }
  }

  lateUIDrawLandscape() {
    let uiBackScaleFactor = this.uiPanel.nativeWidth / this.uiPanel.width;
    this.uiPanel.y -= this.uiPanel.height * (uiBackScaleFactor);
    this.uiPanel.height *= 1 + uiBackScaleFactor;

    let counterLeft = imageLoader.sprite(-this.counter.width, 0, 'counter.png');

    this.counter.addChild(counterLeft);

    let counterRight = imageLoader.sprite(this.counter.width, 0, 'counter.png');

    this.counter.addChild(counterRight);
    // let scaleFactor =  LU.FULL_GAME_WIDTH / this.uiPanel.width;
    // uiPanel.width = LU.FULL_GAME_WIDTH


    let scoreFillBack = imageLoader.sprite(21, 17, 'score_fill_back.png');
    scoreFillBack.scale.set(1.1);
    this._gUI.add(scoreFillBack);

    this.scoreFill = imageLoader.sprite(37, 27, 'score_fill.png');
    this._gUI.add(this.scoreFill);

    let minusAnlge = 88;
    this.scoreFill.angle = minusAnlge;

    let scoreUI = imageLoader.sprite(0, 0, 'score_ui.png');

    this._gUI.add(scoreUI);

    let starBack_1 = imageLoader.sprite(95, 110, 'ui_star_empty.png');
    starBack_1.anchor.set(0.5);
    this._gUI.add(starBack_1);
    let starBack_2 = imageLoader.sprite(127, 75, 'ui_star_empty.png');
    starBack_2.anchor.set(0.5);
    this._gUI.add(starBack_2);
    let starBack_3 = imageLoader.sprite(138, 30, 'ui_star_empty.png');
    starBack_3.anchor.set(0.5);
    this._gUI.add(starBack_3);

    this._star1 = imageLoader.sprite(starBack_1.x, starBack_1.y, 'ui_star.png');
    this._star1.anchor.set(0.5);
    this._gUI.add(this._star1);
    this._star2 = imageLoader.sprite(starBack_2.x, starBack_2.y, 'ui_star.png');
    this._star2.anchor.set(0.5);
    this._gUI.add(this._star2);
    this._star3 = imageLoader.sprite(starBack_3.x, starBack_3.y, 'ui_star.png');
    this._star3.anchor.set(0.5);
    this._gUI.add(this._star3);

    this._star1.scale.set(0);
    this._star2.scale.set(0);
    this._star3.scale.set(0);

    this._star1.show = ()=> {
      this._game.add.tween(this._star1.scale).to({
        x: [2, 1.4],
        y: [2, 1.4]
      }, 1000, Phaser.Easing.Elastic.Out, true, 1, 0, false);
    };
    this._star2.show = ()=> {
      this._game.add.tween(this._star2.scale).to({
        x: [2, 1.4],
        y: [2, 1.4]
      }, 1000, Phaser.Easing.Elastic.Out, true, 1, 0, false);
    };
    this._star3.show = ()=> {
      this._game.add.tween(this._star3.scale).to({
        x: [2, 1.4],
        y: [2, 1.4]
      }, 1000, Phaser.Easing.Elastic.Out, true, 1, 0, false);
    };

    let m = this._game.add.text(-5, 70, 'moves', this.movesTextStyle);

    this._gUI.add(m);

    m.setTextBounds(0, 0, 125, 30);
    this.movesText = this._game.add.text(-5, 17, '0', this.movesCountTextStyle);
    this.movesText.addFontWeight('bold', 0);


    let grd1 = this.movesText.context.createLinearGradient(0, 0, 0, this.movesText.canvas.height);
    grd1.addColorStop(0, '#fbdb35');
    grd1.addColorStop(1, '#f1f145');
    this.movesText.fill = grd1;

    this.movesText.setTextBounds(0, 0, 125, 50);
    this._gUI.add(this.movesText);
  }

  lateUIDrawPortrait() {

    let scoreFillBack = imageLoader.sprite(21, 17, 'score_fill_back.png');
    scoreFillBack.scale.set(1.1);
    this._gUI.add(scoreFillBack);

    this.scoreFill = imageLoader.sprite(37, 27, 'score_fill.png');
    this._gUI.add(this.scoreFill);

    let minusAnlge = 88;
    this.scoreFill.angle = minusAnlge;


    // this._game.add.tween( this.scoreFill).to({
    // angle:minusAnlge-80
    // }, 5000, Phaser.Easing.Linear.None, true, 0, 0, false);

    let scoreUI = imageLoader.sprite(0, 0, 'score_ui.png');

    this._gUI.add(scoreUI);

    let starBack_1 = imageLoader.sprite(95, 110, 'ui_star_empty.png');
    starBack_1.anchor.set(0.5);
    this._gUI.add(starBack_1);
    let starBack_2 = imageLoader.sprite(127, 75, 'ui_star_empty.png');
    starBack_2.anchor.set(0.5);
    this._gUI.add(starBack_2);
    let starBack_3 = imageLoader.sprite(138, 30, 'ui_star_empty.png');
    starBack_3.anchor.set(0.5);
    this._gUI.add(starBack_3);

    this._star1 = imageLoader.sprite(starBack_1.x, starBack_1.y, 'ui_star.png');
    this._star1.anchor.set(0.5);
    this._gUI.add(this._star1);
    this._star2 = imageLoader.sprite(starBack_2.x, starBack_2.y, 'ui_star.png');
    this._star2.anchor.set(0.5);
    this._gUI.add(this._star2);
    this._star3 = imageLoader.sprite(starBack_3.x, starBack_3.y, 'ui_star.png');
    this._star3.anchor.set(0.5);
    this._gUI.add(this._star3);

    this._star1.scale.set(0);
    this._star2.scale.set(0);
    this._star3.scale.set(0);

    this._star1.show = ()=> {
      this._game.add.tween(this._star1.scale).to({
        x: [2, 1.4],
        y: [2, 1.4]
      }, 1000, Phaser.Easing.Elastic.Out, true, 1, 0, false);
    };
    this._star2.show = ()=> {
      this._game.add.tween(this._star2.scale).to({
        x: [2, 1.4],
        y: [2, 1.4]
      }, 1000, Phaser.Easing.Elastic.Out, true, 1, 0, false);
    };
    this._star3.show = ()=> {
      this._game.add.tween(this._star3.scale).to({
        x: [2, 1.4],
        y: [2, 1.4]
      }, 1000, Phaser.Easing.Elastic.Out, true, 1, 0, false);
    };

    let m = this._game.add.text(-5, 70, 'moves', this.movesTextStyle);

    this._gUI.add(m);

    m.setTextBounds(0, 0, 125, 30);
    this.movesText = this._game.add.text(-5, 17, '25', this.movesCountTextStyle);
  //  this.movesText.addFontWeight('bold', 0);


    let grd1 = this.movesText.context.createLinearGradient(0, 0, 0, this.movesText.canvas.height);
    grd1.addColorStop(0, '#fbdb35');
    grd1.addColorStop(1, '#f1f145');
    this.movesText.fill = grd1;

    this.movesText.setTextBounds(0, 0, 125, 50);
    this._gUI.add(this.movesText);
  }

  lateUIDraw() {
    LP(this.lateUIDrawLandscape, this.lateUIDrawPortrait).apply(this);
  }

  initUIPortrait() {
    let uiPanel = imageLoader.sprite(0, 0, 'topBackground');
    this._gUI.add(uiPanel);

    let xPositions = [
      [uiPanel.width * 0.5],
      [uiPanel.width * 0.7, uiPanel.width * 0.3],
      [uiPanel.width * 0.5, uiPanel.width * 0.2, uiPanel.width * 0.8]
    ];

    this.peter = imageLoader.sprite(xPositions[this._recipesInfo.length - 1][0], 300, 'peter_normal.png');
    this._game.add.tween(this.peter).to({
      angle: [-5, 0, 5, 0]
    }, 5000, Phaser.Easing.Linear.None, true, 0, -1, false);

    this.peter.anchor.setTo(0.5, 1);
    this._gUI.add(this.peter);

    if (this._recipesInfo.length > 1) {
      this.stewie = imageLoader.sprite(xPositions[this._recipesInfo.length - 1][1], 280, 'stewie_normal.png');
      this.stewie.anchor.setTo(0.5, 1);
      this._gUI.add(this.stewie);

      this._game.add.tween(this.stewie).to({
        angle: [-4, 0, 4, 0]
      }, 4000, Phaser.Easing.Linear.None, true, 750, -1, false);
    }

    if (this._recipesInfo.length > 2) {
      this.louis = imageLoader.sprite(xPositions[this._recipesInfo.length - 1][2], 300, 'lois_normal.png');
      this.louis.anchor.setTo(0.5, 1);
      this._gUI.add(this.louis);

      this._game.add.tween(this.louis).to({
        angle: [-3, 0, 3, 0]
      }, 3500, Phaser.Easing.Linear.None, true, 500, -1, false);
    }

    let counter = imageLoader.sprite(0, uiPanel.height, 'counter.png');
    this._gUI.add(counter);

    if (this._recipesInfo.length > 1) {
      this.stewie.drink = (glass)=> {
        this.stewie.frameName = 'stewie_drink.png';
        this.stewie.addChild(glass);
        this._game.tweens.removeFrom(this.stewie);
        this._game.add.tween(this.stewie.scale).to({
          x: [1.1, 1.05, 1.07, 1],
          y: [1.1, 1.05, 1.07, 1]
        }, 1200, Phaser.Easing.Linear.None, true, 0, 0, false).onComplete.add(()=> {
          this._game.add.tween(this.stewie).to({
            angle: 75,
            //  y: this.stewie.y+50,
            alpha: [1, 1, 0],
          }, 1000, Phaser.Easing.Linear.None, true, 0, 0, false);
        });
        glass.angle = 95;
        glass.scale.set(0.5);
        glass.y = -70;
        glass.x = -30;
      };
    }

    if (this._recipesInfo.length > 2) {
      this.louis.drink = (glass)=> {
        this.louis.frameName = 'lois_drink.png';
        this.louis.addChild(glass);

        this._game.tweens.removeFrom(this.louis);
        this._game.add.tween(this.louis.scale).to({
          x: [1.1, 1.05, 1.07, 1],
          y: [1.1, 1.05, 1.07, 1]
        }, 1200, Phaser.Easing.Linear.None, true, 0, 0, false).onComplete.add(()=> {
          this._game.add.tween(this.louis).to({
            angle: 75,
            //   y: this.stewie.y+50
            alpha: [1, 1, 0],
          }, 1000, Phaser.Easing.Linear.None, true, 0, 0, false);
        });
        glass.angle = 100;
        glass.scale.set(0.7);
        glass.y = -175;
        glass.x = -40;
      };
    }

    this.peter.drink = (glass)=> {
      this.peter.frameName = 'peter_drink.png';
      this.peter.addChild(glass);

      this._game.tweens.removeFrom(this.peter);
      this._game.add.tween(this.peter.scale).to({
        x: [1.1, 1.05, 1.07, 1],
        y: [1.1, 1.05, 1.07, 1]
      }, 1200, Phaser.Easing.Linear.None, true, 0, 0, false).onComplete.add(()=> {
        this._game.add.tween(this.peter).to({
          angle: 60,
          alpha: [1, 1, 0],
        }, 1000, Phaser.Easing.Linear.None, true, 0, 0, false);
      });
      glass.angle = 95;
      glass.scale.set(0.8);
      glass.y = -240;
      glass.x = -50;

    };


    const topOffset = 270;
    const leftOffset = [340, 200, 140][this._recipesInfo.length - 1];
    const cellW = [220, 300, 220][this._recipesInfo.length - 1];
    const rCountOffsetX = 27;
    const rCountOffsetY = 5;

    let colours = ['#107fff', '#34a316', '#9a22d5', '#cd0110', '#ac6800', '#f64c01'];
    let heroesToDrink = [
      [this.peter],
      [this.stewie, this.peter],
      [this.stewie, this.peter, this.louis]
    ][this._recipesInfo.length - 1];
    for (let i = 0; i < this._recipesInfo.length; i++) {
      let img = imageLoader.sprite(leftOffset + i * cellW, topOffset, `chip_${this._recipesInfo[i].color}_0.png`);
      img.anchor.set(0.5);
      img.scale.set(0.9);
      this._gUI.add(img);

      let score_disc = imageLoader.sprite(leftOffset + i * cellW + rCountOffsetX, topOffset + rCountOffsetY, `score_disc.png`);
      score_disc.x += 15;
      score_disc.y += 15;
      score_disc.anchor.set(0.5);
      this._gUI.add(score_disc);

      let check = imageLoader.sprite(leftOffset + i * cellW + rCountOffsetX, topOffset + rCountOffsetY, `check.png`);
      check.x += 15;
      check.y += 15;
      check.anchor.set(0.5);
      check.scale.set(0);
      this._gUI.add(check);
        console.log("addted text",this._recipesInfo[i].count)
      let count = this._game.add.text(0, 2, this._recipesInfo[i].count, this.recipesTextStyle);
      count.fill = colours[this._recipesInfo[i].color];
      count.anchor.setTo(0.5, 0.5);

      this.totalRecipesCount += this._recipesInfo[i].count;
      score_disc.addChild(count);

      this.recipeItems.push({
        img: img,
        text: count,
        check: check,
        heroes: heroesToDrink[i]
      });
    }


    // this.scoreText = this._game.add.text(480, 10, '1000', this.testStylePortrait3);
    // this.scoreText.setTextBounds(0, 0, 125, 50);
    // this._gUI.add(this.scoreText);
  }


  getRecipeView(number) {
    if (this.recipeItems.length != 0)
      return this.recipeItems[number].img;
  }

  getUIElementView(name) {
    return this[name];
  }

  decreceRecipe(number) {
    this._game.add.tween(this.recipeItems[number].img.scale).to({
      x: [1.5, 1],
      y: [1.5, 1]
    }, 300, Phaser.Easing.Sinusoidal.InOut, true).start().onComplete.add(()=> {
      this.recipeItems[number].img.scale.set(1);
    });
  }

  // showStars(curVal, maxVal) {
  //
  //   const delta = maxVal / 3;
  //
  //   let number = curVal > delta * 0.5 ? (curVal > delta ? (curVal > delta * 2 ? 3 : 2) : 1) : 0;
  //
  //   switch (number) {
  //     case 1:
  //       this._star1.show();
  //       break;
  //     case 2:
  //       if (this._star1.scale.x == 0)
  //         this._star1.show();
  //       this._star2.show();
  //       break;
  //     case 3:
  //       if (this._star1.scale.x == 0)
  //         this._star1.show();
  //       if (this._star2.scale.x == 0)
  //         this._star2.show();
  //       this._star3.show();
  //       break;
  //     default:
  //       break;
  //   }
  // }

  updateRecipes() {
    this.currentRecipesCount = 0;
    for (let i = 0; i < this.recipeItems.length; i++) {
      let newCount = this._recipesInfo[i].count;
      this.currentRecipesCount += newCount;

      if (newCount == 0) {
        if (this.recipeItems[i].text.visible !== false) {
          this.recipeItems[i].text.visible = false;
          this._game.time.events.add(1000, ()=> {
              this.recipeItems[i].heroes.drink(this.recipeItems[i].img);
          });
          this._game.add.tween(this.recipeItems[i].check.scale).to({
            x: [2, 1],
            y: [2, 1]
          }, 600, Phaser.Easing.Sinusoidal.InOut, true).start();
        }
      }
      else {
        this.recipeItems[i].text.text = newCount;
      }
    }


    let progressResult = (1 - this.currentRecipesCount / this.totalRecipesCount);
    // this._checkedStars = progressResult > 0.33 ? (progressResult > 0.66 ? (progressResult >= 1 ? 3 : 2) : 1) : 0;
    if (this._star1.scale.x == 0 && progressResult >= 0.333) {
      this._star1.show();

    }

    if (this._star2.scale.x == 0 && progressResult >= 0.666) {
      this._star2.show();

    }

    if (this._star3.scale.x == 0 && progressResult >= 1) {
      this._star3.show();

    }


    this._game.add.tween(this.scoreFill).to({
      angle: 88 - (88 * progressResult)
    }, 400, Phaser.Easing.Linear.None, true, 0, 0, false);

    // this._game.add.tween(this.progressBar.scale).to({
    //   x: progressResult
    // }, 400, Phaser.Easing.Sinusoidal.Out, true).start();

  }
}
