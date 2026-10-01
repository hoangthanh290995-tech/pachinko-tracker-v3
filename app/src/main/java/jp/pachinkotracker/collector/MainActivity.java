package jp.pachinkotracker.collector;

import android.app.Activity;
import android.os.Bundle;
import android.os.Handler;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.graphics.Color;
import android.view.ViewGroup;
import android.widget.LinearLayout;
import android.widget.TextView;
import org.json.JSONArray;
import org.json.JSONObject;
import org.json.JSONTokener;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

public class MainActivity extends Activity {
    private static final String SOURCE = "https://www.pscube.jp/dedamajyoho-P-townDMMpachi/c732920/";
    private static final String API = "https://pachinko-data-api.onrender.com/api/mobile-import";
    private static final long INTERVAL = 5 * 60 * 1000L;
    private WebView web; private TextView status; private final Handler handler = new Handler();
    @Override public void onCreate(Bundle b) { super.onCreate(b); LinearLayout root=new LinearLayout(this); root.setOrientation(LinearLayout.VERTICAL); status=new TextView(this); status.setText("P'sCUBEを開いてデータ収集中…"); status.setTextSize(16); status.setTextColor(Color.WHITE); status.setBackgroundColor(Color.rgb(30,30,30)); status.setPadding(20,18,20,18); root.addView(status,new LinearLayout.LayoutParams(-1,-2)); web=new WebView(this); WebSettings s=web.getSettings(); s.setJavaScriptEnabled(true); s.setDomStorageEnabled(true); s.setDatabaseEnabled(true); s.setLoadWithOverviewMode(true); s.setUseWideViewPort(true); web.setWebViewClient(new WebViewClient(){ @Override public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest r){return false;} @Override public void onPageFinished(WebView v,String url){handler.postDelayed(()->collect(),1800);} }); root.addView(web,new LinearLayout.LayoutParams(-1,0,1)); setContentView(root); web.loadUrl(SOURCE); handler.postDelayed(new Runnable(){public void run(){collect(); handler.postDelayed(this,INTERVAL);}},30000); }
    private void collect(){ if(web==null)return; status.setText("P'sCUBE: đang đọc DATA + 詳細グラフ…"); String js="(function(){var rows=[...document.querySelectorAll('tr')],machines=[];rows.forEach(function(r){var t=(r.innerText||'').trim(),m=t.match(/\\b(\\d{4})\\b/);if(!m)return;var ns=(t.match(/[-+]?\\d[\\d,]*(?:\\.\\d+)?/g)||[]).map(function(x){return Number(x.replace(/,/g,''));});machines.push({id:m[1],raw:t,numbers:ns.slice(0,50),days:ns.slice(1,31)});});var assets=[...document.querySelectorAll('img,source,a')].map(function(e){return e.src||e.href||''}).filter(function(u){return /graph|slump|chart|detail|history/i.test(u)});return JSON.stringify({url:location.href,updated:new Date().toISOString(),machines:machines,graphAssets:[...new Set(assets)]});})()"; web.evaluateJavascript(js,value->{try{Object x=new JSONTokener(value).nextValue();if(!(x instanceof String))throw new Exception("JS result invalid");JSONObject p=new JSONObject((String)x);JSONArray ms=p.optJSONArray("machines");if(ms==null||ms.length()==0){status.setText("P'sCUBE chưa có bảng DATA");return;}post(p.toString());}catch(Exception e){status.setText("Thu thập lỗi: "+e.getMessage());}}); }
    private void post(String json){new Thread(()->{try{URL u=new URL(API);HttpURLConnection c=(HttpURLConnection)u.openConnection();c.setRequestMethod("POST");c.setDoOutput(true);c.setConnectTimeout(15000);c.setReadTimeout(15000);c.setRequestProperty("Content-Type","application/json; charset=UTF-8");byte[] b=json.getBytes(StandardCharsets.UTF_8);try(OutputStream o=c.getOutputStream()){o.write(b);}int code=c.getResponseCode();runOnUiThread(()->status.setText(code>=200&&code<300?"✓ Đã gửi P'sCUBE · cập nhật 5 phút/lần":"API lỗi: "+code));c.disconnect();}catch(Exception e){runOnUiThread(()->status.setText("Không gửi được: "+e.getMessage()));}}).start();}
    @Override protected void onDestroy(){handler.removeCallbacksAndMessages(null);if(web!=null)web.destroy();super.onDestroy();}
}
