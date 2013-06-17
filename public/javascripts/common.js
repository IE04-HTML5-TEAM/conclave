$(function(){
  // ログアウト時にsessionStorageをクリアする
  $("input#logout").click(function(){
    sessionStorage.clear();
  });
});
