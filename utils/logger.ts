const info = (...params: any[]) => {
  console.log(...params);
};

const errorLog = (...params: any[]) => {
  console.error(...params);
};

export { info, errorLog };
