$(document).ready(function() {
	$("button").click(function() {
		$('.navbar').toggle('slow');
	});
		$("#search").click(function() {
		$('.social').toggle('slow');
	});
		$("#setting").click(function() {
		$('.left-bar').toggle('slow');
	});
		$("#account").click(function() {
		$('.user-right').toggle('slow');
	});

});