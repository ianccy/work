$(document).ready(function() {
function check_if_in_view() {
/*判斷手機尺寸*/
if(document.body.clientWidth>400){
/*判斷螢幕 scrollTop:滾動距離，height:高度*/
  var window_bottom_position = ($(window).scrollTop() + $(window).height());

  $.each($('.animation-element'), function() {
 /*判斷物件 offset:上方距離，outerHeight:高度*/
    var element_bottom_position = ($(this).offset().top + $(this).outerHeight());
 
/*檢視觸發規則 使用完全滾出物件才觸發*/
    if (element_bottom_position <= window_bottom_position) {
      $(this).addClass('in-view');
    } else {
      $(this).removeClass('in-view');
    }
  });
}
else {
  $('.animation-element').addClass('in-view');
}
}
$(window).on('scroll resize', check_if_in_view);

});