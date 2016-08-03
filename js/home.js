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

        $("#language").click(function() {
        $('.language-list').toggle('slow');
    });
        $("#dollar").click(function() {
        $('.dollar-list').toggle('slow');
    });
        
    var swiper = new Swiper('.swiper-container', {
        pagination: '.swiper-pagination',
        nextButton: '.swiper-button-next',
        prevButton: '.swiper-button-prev',
        slidesPerView: 1,
        paginationClickable: true,
        spaceBetween: 30,
        loop: true
    });
        var swiper = new Swiper('.swiper-container2', {
        pagination: '.swiper-pagination2',
        nextButton: '.next',
        prevButton: '.prev',
        slidesPerView: 1,
        paginationClickable: true,
        spaceBetween: 30,
        loop: true
    });

});