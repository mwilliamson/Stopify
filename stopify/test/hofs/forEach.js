let arr = [1,2,3,4,5];
arr.forEach(function (v,i) {
  while (false) {}
  arr[i] = 2*v;
});

for (let i=1; i<=5; i++) {
  if (arr[i-1] !== 2*i) {
    throw 'error occurred';
  }
}

