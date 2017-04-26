export default class GameCustomDestroy {
  constructor(m3e, gameView, customActions, simpleMove) {
    this._m3e = m3e;
    this._gameView = gameView;
    if (!simpleMove) {
      this._m3e.specialDestroyBehavior.line = this.lineDestroy;
      this._m3e.specialDestroyBehavior.crossLine = this.crossLineDestroy;
      this._m3e.specialDestroyBehavior.bomb = this.bombDestroy;
      this._m3e.specialDestroyBehavior.moveSlotsEffect = this.moveSlotsEffect;
    }
    this.addNewPattern('6', [{func: this.pawDestroy, args: []}], [{
      func: this.pawEffect,
      args: [customActions, this._gameView]
    }]);
  }

  addNewPattern(type, functions, effects) {
    this._m3e.specialDestroyBehavior.addPattern(type, functions, effects);
  }

  pawDestroy(chip) {
    chip.currentChip.mIgnoreDestroyEffect = true;
    return [this._m3e.getSlot(chip.mI, chip.mJ)];
  }

  pawEffect(customActions, gameVeiw, slot) {
    customActions.addCollectedPaws();
    let targetChip = null;
    this._m3e.forEachSlot((slot)=> {
      let curChip = slot.currentChip;
      if (!this._foxSlot && curChip != 'no_chip' && curChip.type == 7)
        targetChip = slot.currentChip;
    });

    gameVeiw.effects.pawDestroy(slot, targetChip);
  }

  lineDestroy(isVertical, size, slot) {
    let chipsToRemove = [];
    let curI = slot.mI;
    let curJ = slot.mJ;
    for (let i = -Math.floor(size / 2); i < Math.round(size / 2); i++) {
      let curSlot = this._m3e.getSlot(isVertical ? curI + i : curI, isVertical ? curJ : curJ + i);
      if (curSlot.exist) {
        let i = 0;
        if (!isVertical) {
          for (i = 0; i <= this._m3e.mLevel.fieldMask.totalColumns; i++) {
            let findChip = this._m3e.getSlot(i, curSlot.slot.mJ);
            if (findChip.exist && findChip.slot.currentChip.canMatch)
              chipsToRemove.push(findChip);
            this.moveSlotsEffect(findChip, false, false, true, true);
          }
        }
        else {
          for (i = 0; i <= this._m3e.mLevel.fieldMask.totalRows; i++) {
            let findChip = this._m3e.getSlot(curSlot.slot.mI, i);
            if (findChip.exist && findChip.slot.currentChip.canMatch)
              chipsToRemove.push(findChip);
            this.moveSlotsEffect(findChip, true, true, false, false);
          }
        }
      }
    }
    return chipsToRemove;
  }

  crossLineDestroy(size, slot) {
    let chipsToRemove = [];

    let curI = slot.mI;
    let curJ = slot.mJ;

    for (let i = -Math.floor(size / 2); i < Math.round(size / 2); i++) {
      let curSlot = this._m3e.getSlot(curI + i, curJ);
      if (curSlot.exist) {
        let c = curSlot.slot.mI;
        let r = curSlot.slot.mJ;
        let sum = c + r;

        for (let i = 0; i <= this._m3e.mLevel.fieldMask.totalColumns; i++) {
          for (var j = 0; j <= this._m3e.mLevel.fieldMask.totalRows; j++) {
            if (((i + j) == sum) || (Math.abs(c - i) == Math.abs(r - j))) {
              let findChip = this._m3e.getSlot(i, j);
              if (findChip.exist && findChip.slot.currentChip.canMatch) {
                chipsToRemove.push(findChip);
                this.moveSlotsEffect(findChip, true, true, false, false);
              }
            }
          }
        }
      }
    }
    return chipsToRemove;
  }

  moveSlotsEffect(curSlot, left, right, top, bottom) {
    if (left) {
      let slotLeft = this._m3e.getSlot(curSlot.slot.mI - 1, curSlot.slot.mJ);
      if (slotLeft.exist && slotLeft.slot.currentChip != 'no_chip' && slotLeft.slot.currentChip.mMoveSteps.length === 0) {
        slotLeft.slot.currentChip.mMoveSteps.push({x: slotLeft.slot.mI - 0.5, y: slotLeft.slot.mJ, skipPostMove: true});
        slotLeft.slot.currentChip.mMoveSteps.push({x: slotLeft.slot.mI, y: slotLeft.slot.mJ, skipPostMove: true});
        slotLeft.slot.mSkipPostMove = true;

      }
    }

    if (right) {
      let slotRight = this._m3e.getSlot(curSlot.slot.mI + 1, curSlot.slot.mJ);
      if (slotRight.exist && slotRight.slot.currentChip != 'no_chip' && slotRight.slot.currentChip.mMoveSteps.length === 0) {
        slotRight.slot.currentChip.mMoveSteps.push({
          x: slotRight.slot.mI + 0.5,
          y: slotRight.slot.mJ,
          skipPostMove: true
        });
        slotRight.slot.currentChip.mMoveSteps.push({x: slotRight.slot.mI, y: slotRight.slot.mJ, skipPostMove: true});
        slotRight.slot.mSkipPostMove = true;
      }
    }

    if (top) {
      let slotTop = this._m3e.getSlot(curSlot.slot.mI, curSlot.slot.mJ - 1);
      if (slotTop.exist && slotTop.slot.currentChip != 'no_chip' && slotTop.slot.currentChip.mMoveSteps.length === 0) {
        slotTop.slot.currentChip.mMoveSteps.push({x: slotTop.slot.mI, y: slotTop.slot.mJ - 0.5, skipPostMove: true});
        slotTop.slot.currentChip.mMoveSteps.push({x: slotTop.slot.mI, y: slotTop.slot.mJ, skipPostMove: true});
        slotTop.slot.mSkipPostMove = true;
      }
    }

    if (bottom) {
      let slotBottom = this._m3e.getSlot(curSlot.slot.mI, curSlot.slot.mJ + 1);
      if (slotBottom.exist && slotBottom.slot.currentChip != 'no_chip' && slotBottom.slot.currentChip.mMoveSteps.length === 0) {
        slotBottom.slot.currentChip.mMoveSteps.push({
          x: slotBottom.slot.mI,
          y: slotBottom.slot.mJ + 0.5,
          skipPostMove: true
        });
        slotBottom.slot.currentChip.mMoveSteps.push({x: slotBottom.slot.mI, y: slotBottom.slot.mJ, skipPostMove: true});
        slotBottom.slot.mSkipPostMove = true;
      }
    }
  }

  bombDestroy(size, chip) {
    let chipsToRemove = [];

    for (var i = -Math.floor(size * 0.5); i < Math.round(size * 0.5); i++) {
      for (var j = -Math.floor(size * 0.5); j < Math.round(size * 0.5); j++) {
        let findChip = this._m3e.getSlot(i + chip.mI, j + chip.mJ);
        if (findChip.exist && findChip.slot.currentChip.canMatch) {
          chipsToRemove.push(findChip);

          this.moveSlotsEffect(findChip, true, true, true, true);

        }
      }
    }
    return chipsToRemove;
  }


}
