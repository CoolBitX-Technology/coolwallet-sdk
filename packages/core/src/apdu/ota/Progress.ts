class Progress {
  pivot = 0;

  steps: number[];

  constructor(steps: number[]) {
    this.steps = steps;
  }

  current(): number {
    return this.steps[this.pivot];
  }

  next(): number {
    if (this.pivot < this.steps.length - 1) {
      this.pivot += 1;
    }
    return this.current();
  }
}

export default Progress;
