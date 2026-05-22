package com.example.sinuca;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Button;

import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {

    Button play;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        play = findViewById(R.id.btnPlay);

        play.setOnClickListener(v -> {

            Intent intent =
                    getPackageManager()
                    .getLaunchIntentForPackage(
                            "com.seleuco.mame4d2024");

            startActivity(intent);

        });
    }
}
