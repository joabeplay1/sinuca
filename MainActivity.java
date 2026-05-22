package com.example.arcadefliperama;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;

import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {

    Button metalSlug;
    Button kof;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        metalSlug = findViewById(R.id.btnMetalSlug);
        kof = findViewById(R.id.btnKOF);

        metalSlug.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {

                Intent intent =
                    getPackageManager()
                    .getLaunchIntentForPackage(
                    "com.seleuco.mame4d2024");

                startActivity(intent);
            }
        });

        kof.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {

                Intent intent =
                    getPackageManager()
                    .getLaunchIntentForPackage(
                    "com.seleuco.mame4d2024");

                startActivity(intent);
            }
        });
    }
}
