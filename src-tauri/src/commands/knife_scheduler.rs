use chrono::{Datelike, Local, Timelike};
use std::{thread, time::Duration};
use tokio::task;

use crate::commands::knife_score::{reset_daily_scores, reset_monthly_scores};

pub fn start_knife_scheduler() {
    task::spawn(async {
        loop {
            let now = Local::now();
            let hour = now.hour();
            let minute = now.minute();

            if hour == 0 && minute == 0 {
                println!("[🔁] É meia-noite! Resetando placar diário...");
                if let Err(e) = reset_daily_scores() {
                    println!("❌ Erro ao resetar placar diário: {}", e);
                } else {
                    println!("✅ Placar diário resetado.");
                }

                let today = now.day();
                let last_day = chrono::NaiveDate::from_ymd_opt(now.year(), now.month(), 1)
                    .unwrap()
                    .with_month(now.month() % 12 + 1)
                    .unwrap()
                    .pred_opt()
                    .unwrap()
                    .day();

                if today == last_day {
                    println!("[📆] Último dia do mês detectado. Resetando placar mensal...");
                    if let Err(e) = reset_monthly_scores() {
                        println!("❌ Erro ao resetar placar mensal: {}", e);
                    } else {
                        println!("✅ Placar mensal resetado.");
                    }
                }

                thread::sleep(Duration::from_secs(61));
            }

            thread::sleep(Duration::from_secs(30));
        }
    });
}
