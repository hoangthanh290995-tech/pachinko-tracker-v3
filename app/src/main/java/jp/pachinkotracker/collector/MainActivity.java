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
    private WebView web;
    private TextView status;
    private final Handler handler = new Handler();

    @Override public void onCreate(Bundle b) {
        super.onCreate(b);
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        status = new TextView(this);
        status.setText("P'sCUBEを開いてデータ収集中…");
        status.setTextSize(16); status.setTextColor(Color.WHITE); status.setBackgroundColor(Color.rgb(30,30,30)); status.setPadding(20,18,20,18);
        root.addView(status, new LinearLayout.LayoutParams(-1, -2));
        web = new WebView(this);
        WebSettings s = web.getSettings(); s.setJavaScriptEnabled(true); s.setDomStorageEnabled(true); s.setDatabaseEnabled(true); s.setLoadWithOverviewMode(true); s.setUseWideViewPort(true);
        web.setWebViewClient(new WebViewClient(){
            @Override public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r){ return false; }
            @Override public void onPageFinished(WebView v, String url){ super.onPageFinished(v,url); handler.postDelayed(() -> collect(), 1800); }
        });
        root.addView(web, new LinearLayout.LayoutParams(-1,0,1));
        setContentView(root);
        web.loadUrl(SOURCE);
        handler.postDelayed(new Runnable(){ @Override public void run(){ collect(); handler.postDelayed(this, INTERVAL); }}, 30000);
    }

    private void collect(){
        if (web == null) return;
        runOnUiThread(() -> status.setText("P'sCUBE: đang đọc DATA + 詳細グラフ…"));
        String js = "(function(){"+
                "var rows=[...document.querySelectorAll('tr')];"+
                "var machines=[];"+
                "rows.forEach(function(r){var t=(r.innerText||'').trim();var m=t.match(/\\b(\\d{4})\\b/);if(!m)return;var id=m[1];var ns=(t.match(/[-+]?\\d[\\d,]*(?:\\.\\d+)?/g)||[]).map(function(x){return Number(x.replace(/,/g,''));});machines.push({id:id,model:(document.querySelector('h1,h2,h3,.title,.ttl')||{}).innerText||'',raw:t,numbers:ns.slice(0,50),days:ns.slice(1,31)});});"+
                "var assets=[...document.querySelectorAll('img,source,a')].map(function(e){return e.src||e.href||''}).filter(function(u){return /graph|slump|chart|detail|history/i.test(u);}).filter(function(u,i,a){return u&&a.indexOf(u)===i;}).slice(0,100);"+
                "var labels=[...document.querySelectorAll('a,button,div,span')].filter(function(e){return /詳細グラフ|グラフ/i.test((e.innerText||'').trim());}).map(function(e){return e.href||e.dataset.href||''}).filter(Boolean);"+
                "assets=assets.concat(labels).filter(function(u,i,a){return u&&a.indexOf(u)===i;}).slice(0,100);"+
                "return JSON.stringify({url:location.href,updated:new Date().toISOString(),machines:machines,graphAssets:assets});"+
                "})()";
        web.evaluateJavascript(js, value -> {
            try {
                Object parsed = new JSONTokener(value).nextValue();
                if (!(parsed instanceof String)) throw new Exception("JS result invalid");
                JSONObject p = new JSONObject((String) parsed);
                JSONArray ms = p.optJSONArray("machines");
                if (ms == null || ms.length() == 0) { status.setText("P'sCUBE chưa có bảng DATA trên trang này"); return; }
                for(int i=0;i<ms.length();i++) ms.getJSONObject(i).put("graphAssets", p.optJSONArray("graphAssets"));
                p.put("machines", ms);
                post(p.toString());
            } catch(Exception e){ status.setText("Thu thập lỗi: "+e.getMessage()); }
        });
    }

    private void post(final String json){
        new Thread(() -> {
            try {
                URL u=new URL(API); HttpURLConnection c=(HttpURLConnection)u.openConnection(); c.setRequestMethod("POST"); c.setDoOutput(true); c.setConnectTimeout(15000); c.setReadTimeout(15000); c.setRequestProperty("Content-Type","application/json; charset=UTF-8");
                byte[] b=json.getBytes(StandardCharsets.UTF_8); c.setFixedLengthStreamingMode(b.length);
                try(OutputStream out=c.getOutputStream()){out.write(b);}
                int code=c.getResponseCode();
                runOnUiThread(() -> status.setText(code>=200&&code<300 ? "✓ Đã gửi dữ liệu P'sCUBE · tự cập nhật 5 phút/lần" : "API nhận dữ liệu lỗi: "+code));
                c.disconnect();
            } catch(Exception e){ runOnUiThread(() -> status.setText("Không gửi được dữ liệu: "+e.getMessage())); }
        }).start();
    }

    @Override protected void onDestroy(){ handler.removeCallbacksAndMessages(null); if(web!=null) web.destroy(); super.onDestroy(); }
}
