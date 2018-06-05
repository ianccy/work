````
<!DOCTYPE html>
<html lang="zh-tw">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
  <meta name="description" content="">
  <meta name="author" content="">
  <title>範例RRR</title>
  <!-- Bootstrap core CSS -->
  <link href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css" rel="stylesheet">
  <!-- Custom styles for this template -->
  <style>
    body {
      padding-top: 54px;
    }
    .form-group {
      text-align: left;
  }
  img.img-responsive {
    height: 400px;
  }
    @media (min-width: 992px) {
      body {
        padding-top: 56px;
      }
    }
    @media (max-width: 980px) {
      img.img-responsive {
          height: 250px;
      }  
    }
    @media (max-width: 480px) {
      img.img-responsive {
          height: 100px;
      }
    }
  </style>
  //上面是style 不重要
<body>
  <!-- Page Content -->
  <div class="container">
    <div class="row">
      <div class="col-lg-12 text-center">
        <h1 class="mt-5">哈嚕 我是鹹酥雞老闆</h1>
        <p class="lead">請問你要吃蝦米勒!</p>
        <ul class="list-unstyled">
          <li class="col-xs-6">
            <img class="img-responsive" src="./img/鹹酥雞.jpg" alt="">
            <h2>鹹酥雞</h2>
            <p>NT.50</p>
            <select name="number" class="select form-control" data-price="50" data-name="鹹酥雞">
              <option style="display:none" value="">請選擇數量</option>
              <option value="1">1份</option>
              <option value="2">2份</option>
              <option value="3">3份</option>
            </select>
          </li>
          <li class="col-xs-6">
            <img class="img-responsive" src="./img/由於.JPG" alt="">
            <h2>魷魚</h2>
            <p>NT.50</p>
            <select name="number" class="select form-control" data-price="50" data-name="魷魚">
              <option style="display:none" value="">請選擇數量</option>
              <option value="1">1份</option>
              <option value="2">2份</option>
              <option value="3">3份</option>
            </select>
          </li>
        </ul>
        <div class="form-group col-xs-12">
          <label for="pwd">姓名:</label>
          <input type="text" class="form-control" id="name">
        </div>
        <div class="form-group col-xs-12">
          <label for="pwd">電話:</label>
          <input type="number" class="form-control" id="phone">
        </div>
        <div class="form-group col-xs-12">
          <button type="button" id="sendOrder" class="btn btn-primary col-xs-12">送出訂單</button>
        </div>
        <div class="col-xs-12 text-center">純屬線上訂購 demo</div>
      </div>
    </div>
  </div>
<div id="footer">製作 by <a href="https://ianchuu.com" target="_blank">Ian Chu.</a></div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/1.11.1/jquery.min.js"></script>
  <!-- Bootstrap core JavaScript -->
  <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js"></script>
  <script>
    $(function(){
        // 監聽 送出訂單 按鈕點擊
        // 下面這段主要在組合資料，還有擋使用者不填資料不能送出
        $('#sendOrder').click(function(e){
        var status = true;
        // 姓名
        var name = $('#name').val();
        // 電話
        var phone = $('#phone').val(); 
        // 訂單  後面再加上選項數量*價格
        var order = '';
        // 價格 先預設0 後面再加上
        var price = 0;
        $('input').focus(function(){
          $(this).css('border','');
        });
        // 處理價格 跟 訂單 資料
        $('.select').each(function(index) {
          if($(this).val() !== ''){
            order += $(this).data('name') + ' - ' + $(this).val() + '份 \n';
            price += Number($(this).data('price')) * Number($(this).val());
          }
        });
        order = order.substring(0, order.length - 1);

        // 擋住不填資料邏輯
        if(name == ''){
          $('#name').css('border','1px solid #ff0000');
          status = false;
        }
        if(phone == ''){
          $('#phone').css('border','1px solid #ff0000');
          status = false;
        }
        if(order == ''){
          alert('請選擇訂購品項喔');
          status = false;
        }
        // 如果 必填欄位都過了 才會到這邊
        if(status){
          // 增加日期資料
          var currentdate = new Date();
          var filltime = currentdate.getFullYear() + "/"
                + (currentdate.getMonth() + 1) + "/"
                + currentdate.getDate() + "  "
                + currentdate.getHours() + ":"
                + currentdate.getMinutes() + ":"
                + currentdate.getSeconds();
          // 打包 要的資料
          var data = {
            'name' : name,
            'phone':phone,
            'time': filltime,
            'order': order,
            'price': price,
          }
          // 呼叫 send ajax function
          send(data);
        }
      });
    });
    function send(data){
      $.ajax({
        // 這邊用get type
        type: "get",
        // api url - google appscript 產出的 url
        url: "https://script.google.com/macros/s/xxxxxxxxxxxxxxxxxxxxxxxx/exec",
        // 剛剛整理好的資料帶入
        data: data,
        // 資料格式是JSON 
        dataType: "JSON",
        // 成功送出 會回頭觸發下面這塊感謝
        success: function (response) {
          console.log(response);
          alert('感謝您的訂購！！');
        }
      });
    }
  </script>
</body>
</html>
````


````
function doGet(e) {
  var params = e.parameter;
  // 可以針對你帶入的資料變化  params.xxxxxx      xxxxx = 你帶進來的key值  
  var name = params.name;
  var phone = params.phone;
  var time = params.time;
  var price = params.price;
  var order = params.order;
  
  //將Sheet指定為"資料庫"試算表   SpreadSheet = 試算表 ，貼上excel那段參數
  var SpreadSheet = SpreadsheetApp.openById("1JbXssixJaqTL_xxxxxxxxxxxxxxxxxxxxx");
  //取得頁籤:"工作表1"              Sheet = 頁籤
  var Sheet = SpreadSheet.getSheets()[0];
  //取得有資料的最後一行的"行數"(目的要在最後一行插入新資料)
  var LastRow = Sheet.getLastRow();

 // This represents ALL the data
  var range = Sheet.getRange(LastRow, 6);
  
  // 訂單編號往後+1 
  var orderNum = parseFloat(range.getValues())+1;
  //第一筆訂單 需要轉為1
  if(LastRow == 1){
    orderNum = 1;
  }
  
  //--開始寫入資料--  擋住沒填時間 不給寫入資料，防止被亂撞api
  if(time !== undefined){
  //在最後一行的下一行寫入資料
    Sheet.getRange(LastRow+1, 1).setValue(name);
    Sheet.getRange(LastRow+1, 2).setValue(phone);
    Sheet.getRange(LastRow+1, 3).setValue(time);
    Sheet.getRange(LastRow+1, 4).setValue(order);
    Sheet.getRange(LastRow+1, 5).setValue(price);
    Sheet.getRange(LastRow+1, 6).setValue(orderNum);
    return ContentService.createTextOutput(true);
  }
  // 被亂撞 會回吐這段文字給前端
  return ContentService.createTextOutput('別亂撞我～～ :)');
}
````
