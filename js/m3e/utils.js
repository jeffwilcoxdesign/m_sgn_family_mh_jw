export default class Utils
{
  constructor(){}

  static random(min, max)
  {
    return Math.floor(Math.random() * (max - min + 1)) + min;

  }

  static shuffleArray(array) {
    let currentIndex = array.length,
        temporaryValue, randomIndex;

    while (0 !== currentIndex) {

      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
    return array;
  }


  static randomExcept(min, max, except)
  {
    let rand = Math.floor(Math.random() * (max - min + 1)) + min;
    return  rand==except? Utils.randomExcept(min, max, except): rand;
  }

  static interpolation(easingFunc, curVal, newVal, time, speed)
  {
    let t = Math.min(1,time);
    let result =  curVal + easingFunc(t)* (newVal - curVal);
    return {result: result, speed: speed};
  }

  static arrayInterpolation(easingFunc, curVal, newVal, time, speed)
  {
    let newValLength = newVal.length;
    let newValIndex = Math.min(newValLength-1,Math.floor(newVal.length*time));
    curVal = newValIndex===0 ? curVal: newVal[newValIndex-1];
    let value = newVal[newValIndex];
    let newTime = time*(newValLength) - newValIndex;

    let result =  curVal + easingFunc(newTime)* (value - curVal);
    return {result: result, speed: speed};
  }

}

Utils.sideOffsets = [
  [1, 0, 'right'],
  [1, -1, 'top-right'],
  [0, -1, 'top'],
  [-1, -1, 'top-left'],
  [-1, 0, 'left'],
  [-1, 1, 'bottom-left'],
  [0, 1, 'bottom'],
  [1, 1, 'bottom-right'],
];
