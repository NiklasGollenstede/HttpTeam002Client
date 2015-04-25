
new Promise(function(resolve, reject) {
	print('resolving');
	reject(42);
}).then(function(value) {
	print('value', value);
}).catch(function(error) {
	print('error', error);
});

var id = '72IIhRglGgM';

JsonRequest(
	"get",
	"https://gdata.youtube.com/feeds/api/videos/"+ id +"?v=2&alt=json&fields=yt:rating,yt:statistics,published,title"
).then(function(value) {
	print('value', value);
}).catch(function(error) {
	print('error', error);
});

print([1,2,3,4].reduce(function(a, b) (a+b, a*b), 1));