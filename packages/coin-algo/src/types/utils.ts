type Overwrite<T, U> = Omit<T, keyof U> & U;

export { Overwrite };
