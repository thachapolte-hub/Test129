import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock3, RotateCcw, Play, Trophy, Zap, Sparkles, ArrowLeft, ArrowRight } from "lucide-react";

const ITEMS = [
  { label: "ธรรมจักรศิลาพร้อมกวางหมอบ", answer: "ทวารวดี", icon: "🦌" },
  { label: "พระปรางค์สามยอด", answer: "ละโว้", icon: "🏯" },
  { label: "เหรียญศรีทวารวดยศปุญญะ", answer: "ทวารวดี", icon: "🪙" },
  { label: "ศูนย์กลางเมืองลพบุรี", answer: "ละโว้", icon: "📍" },
  { label: "ประชากรชาวมอญโบราณ", answer: "ทวารวดี", icon: "👥" },
  { label: "อิทธิพลขอมโบราณ", answer: "ละโว้", icon: "👑" },
  { label: "พระพุทธรูปศิลาขาว", answer: "ทวารวดี", icon: "🗿" },
  { label: "พระพุทธรูปปางนาคปรกแบบลพบุรี", answer: "ละโว้", icon: "🐍" },
  { label: "พุทธเถรวาทและมหายาน", answer: "ทวารวดี", icon: "🙏" },
  { label: "พราหมณ์-ฮินดูและพุทธมหายาน", answer: "ละโว้", icon: "🔥" },
  { label: "นครปฐมโบราณ", answer: "ทวารวดี", icon: "⛩️" },
  { label: "ศาลพระกาฬ", answer: "ละโว้", icon: "🛕" },
];

const CITY = {
  ทวารวดี: {
    name: "ทวารวดี",
    emoji: "🏛️",
    color: "from-amber-500 to-orange-600",
    desc: "นครปฐม · อู่ทอง · ธรรมจักร",
  },
  ละโว้: {
    name: "ละโว้",
    emoji: "🏰",
    color: "from-sky-600 to-indigo-700",
    desc: "ลพบุรี · พระปรางค์สามยอด",
  },
};

function shuffle(array) {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function makeDeck() {
  return shuffle(ITEMS).map((item, index) => ({
    ...item,
    id: `${index}-${item.label}`,
  }));
}

export default function AncientStateQuizGame() {
  const [state, setState] = useState("ready"); // ready | playing | finished
  const [deck, setDeck] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(120);
  const [feedback, setFeedback] = useState("กดเริ่มเกม แล้วแยกของให้ถูกเมือง");
  const [lastAction, setLastAction] = useState(null); // correct | wrong | timeout
  const [flash, setFlash] = useState(false);
  const [pop, setPop] = useState(0);
  const actionLock = useRef(false);
  const timerRef = useRef(null);
  const itemTimerRef = useRef(null);

  const current = deck[currentIndex];
  const total = deck.length || ITEMS.length;
  const answeredCount = Math.min(currentIndex, total);
  const progress = state === "finished" ? 100 : Math.round(((answeredCount + (state === "playing" && current ? 1 : 0)) / total) * 100);

  const startGame = () => {
    const nextDeck = makeDeck();
    setDeck(nextDeck);
    setCurrentIndex(0);
    setScore(0);
    setCombo(0);
    setBestCombo(0);
    setTimeLeft(120);
    setFeedback("แยกของให้ถูกเมือง! ใช้ปุ่มซ้าย/ขวา หรือกดบนจอได้เลย");
    setLastAction(null);
    setPop(0);
    actionLock.current = false;
    setState("playing");
  };

  const resetGame = () => {
    clearInterval(timerRef.current);
    clearTimeout(itemTimerRef.current);
    actionLock.current = false;
    setState("ready");
    setDeck([]);
    setCurrentIndex(0);
    setScore(0);
    setCombo(0);
    setBestCombo(0);
    setTimeLeft(120);
    setFeedback("กดเริ่มเกม แล้วแยกของให้ถูกเมือง");
    setLastAction(null);
    setPop(0);
  };

  const finishGame = () => {
    clearInterval(timerRef.current);
    clearTimeout(itemTimerRef.current);
    setState("finished");
  };

  const nextItem = () => {
    actionLock.current = false;
    setLastAction(null);
    setFeedback("เร็วขึ้นอีกนิด! ของชิ้นต่อไปกำลังมา");
    setPop(0);
    if (currentIndex + 1 >= total) {
      finishGame();
    } else {
      setCurrentIndex((i) => i + 1);
    }
  };

  const handleAnswer = (choice) => {
    if (state !== "playing" || !current || actionLock.current) return;
    actionLock.current = true;

    clearTimeout(itemTimerRef.current);

    const correct = choice === current.answer;
    if (correct) {
      setScore((s) => s + 1);
      setCombo((c) => {
        const next = c + 1;
        setBestCombo((b) => Math.max(b, next));
        return next;
      });
      setLastAction("correct");
      setFeedback(`ถูกต้อง! ${current.label} ไปอยู่เมือง ${choice}`);
      setFlash(true);
      setPop((p) => p + 1);
      setTimeout(() => setFlash(false), 180);
    } else {
      setCombo(0);
      setLastAction("wrong");
      setFeedback(`ผิด! ชิ้นนี้ต้องไปเมือง ${current.answer}`);
    }

    setTimeout(() => nextItem(), 650);
  };

  useEffect(() => {
    if (state !== "playing") return;

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setState("finished");
          clearInterval(timerRef.current);
          clearTimeout(itemTimerRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [state]);

  useEffect(() => {
    if (state !== "playing" || !current) return;

    clearTimeout(itemTimerRef.current);
    itemTimerRef.current = setTimeout(() => {
      if (actionLock.current) return;
      actionLock.current = true;
      setCombo(0);
      setLastAction("timeout");
      setFeedback(`หมดเวลา! ของชิ้นนี้ต้องไปเมือง ${current.answer}`);
      setTimeout(() => nextItem(), 550);
    }, 2500);

    return () => clearTimeout(itemTimerRef.current);
  }, [state, currentIndex, current]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (state !== "playing") return;
      if (e.key === "ArrowLeft") handleAnswer("ทวารวดี");
      if (e.key === "ArrowRight") handleAnswer("ละโว้");
      if (e.key === " ") e.preventDefault();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [state, current]);

  const summary = useMemo(() => {
    const accuracy = total ? Math.round((score / total) * 100) : 0;
    let title = "เริ่มใหม่อีกครั้ง";
    if (accuracy >= 90) title = "ยอดนักแยกเมือง!";
    else if (accuracy >= 70) title = "เก่งมาก!";
    else if (accuracy >= 50) title = "ดีเลย!";
    return { accuracy, title };
  }, [score, total]);

  return (
    <div className={cn("min-h-screen p-4 sm:p-6 text-stone-800", flash ? "bg-emerald-50" : "bg-gradient-to-b from-amber-50 via-orange-50 to-stone-100")}>
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge className="mb-2 rounded-full px-3 py-1 text-sm">เกมเว็บพร้อมเล่น</Badge>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">จับของให้ถูกเมือง: รัฐโบราณในดินแดนไทย</h1>
            <p className="mt-1 text-sm text-stone-600">เล่น 2 นาที แยกสิ่งของของทวารวดีและละโว้ให้ทัน</p>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:min-w-[340px]">
            <Stat label="คะแนน" value={score} icon={<Trophy className="h-4 w-4" />} />
            <Stat label="เวลา" value={`${timeLeft}s`} icon={<Clock3 className="h-4 w-4" />} />
            <Stat label="คอมโบ" value={`x${combo}`} icon={<Zap className="h-4 w-4" />} />
          </div>
        </div>

        <Card className="overflow-hidden rounded-[28px] border-stone-200 shadow-xl">
          <CardContent className="p-4 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="w-full">
                <Progress value={progress} className="h-3" />
                <div className="mt-2 flex items-center justify-between text-xs text-stone-500">
                  <span>ของที่เก็บได้ {answeredCount} / {total}</span>
                  <span>{progress}%</span>
                </div>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {state === "ready" && (
                <motion.div
                  key="ready"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="grid gap-5 lg:grid-cols-2"
                >
                  <div className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-stone-200">
                    <h2 className="text-2xl font-bold">วิธีเล่น</h2>
                    <div className="mt-4 grid gap-3 text-sm leading-7 text-stone-700">
                      <div>• ของจะโผล่มาทีละชิ้น</div>
                      <div>• กด <b>ทวารวดี</b> หรือ <b>ละโว้</b> ให้ทัน</div>
                      <div>• ใช้คีย์บอร์ดได้: ← = ทวารวดี, → = ละโว้</div>
                      <div>• ถูกได้ 1 คะแนน ผิดหรือช้า คอมโบหาย</div>
                    </div>
                    <div className="mt-5 grid grid-cols-2 gap-3 text-xs text-stone-600">
                      <MiniCard icon="🦌" text="ธรรมจักร" />
                      <MiniCard icon="🏯" text="พระปรางค์สามยอด" />
                      <MiniCard icon="🪙" text="เหรียญโบราณ" />
                      <MiniCard icon="🐍" text="พระนาคปรก" />
                    </div>
                  </div>

                  <div className="rounded-[28px] bg-stone-900 p-5 text-white shadow-sm">
                    <div className="flex items-center gap-2 text-amber-300">
                      <Sparkles className="h-5 w-5" />
                      <span className="font-semibold">พร้อมเริ่มแล้ว</span>
                    </div>
                    <h3 className="mt-4 text-3xl font-bold">แยกเมืองให้ทัน</h3>
                    <p className="mt-2 text-white/80">เกมนี้ทำให้เด็กเล่นเหมือนจับของจริง ไม่เหมือนทำข้อสอบ</p>
                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      <CityPreview city={CITY.ทวารวดี} />
                      <CityPreview city={CITY.ละโว้} />
                    </div>
                    <Button onClick={startGame} className="mt-6 h-14 w-full rounded-2xl text-lg font-semibold">
                      <Play className="mr-2 h-5 w-5" /> เริ่มเกม
                    </Button>
                  </div>
                </motion.div>
              )}

              {state === "playing" && current && (
                <motion.div
                  key={current.id}
                  initial={{ opacity: 0, scale: 0.96, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid gap-5 lg:grid-cols-[1.3fr_1fr]"
                >
                  <div className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-stone-200">
                    <div className="flex items-center justify-between gap-3">
                      <Badge variant="secondary" className="rounded-full px-3 py-1">ของชิ้นปัจจุบัน</Badge>
                      <div className="text-sm text-stone-500">กดตอบภายใน 2.5 วินาที</div>
                    </div>

                    <div className="mt-5 flex min-h-[260px] items-center justify-center rounded-[26px] bg-gradient-to-b from-stone-50 to-stone-100 p-4">
                      <motion.div
                        key={current.id}
                        initial={{ y: -18, opacity: 0, scale: 0.96 }}
                        animate={{ y: [0, -8, 0], opacity: 1, scale: 1 }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                        className="w-full max-w-md rounded-[26px] border border-stone-200 bg-white p-5 shadow-lg"
                      >
                        <div className="text-5xl">{current.icon}</div>
                        <h2 className="mt-4 text-2xl font-bold leading-snug sm:text-3xl">{current.label}</h2>
                        <p className="mt-2 text-sm text-stone-500">ลากสายตาไปที่เมืองให้ถูก หรือกดปุ่มด้านล่างให้ไว</p>
                      </motion.div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <ActionButton
                        city={CITY.ทวารวดี}
                        onClick={() => handleAnswer("ทวารวดี")}
                        icon={<ArrowLeft className="h-5 w-5" />}
                      />
                      <ActionButton
                        city={CITY.ละโว้}
                        onClick={() => handleAnswer("ละโว้")}
                        icon={<ArrowRight className="h-5 w-5" />}
                      />
                    </div>

                    <div className={cn(
                      "mt-4 rounded-[24px] p-4 text-center text-lg font-semibold transition-all",
                      lastAction === "correct" && "bg-emerald-100 text-emerald-800",
                      lastAction === "wrong" && "bg-rose-100 text-rose-800",
                      lastAction === "timeout" && "bg-amber-100 text-amber-800",
                      !lastAction && "bg-stone-100 text-stone-600"
                    )}>
                      {feedback}
                    </div>
                  </div>

                  <div className="grid gap-5">
                    <div className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-stone-200">
                      <h3 className="text-xl font-bold">แผนที่เมือง</h3>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                        <CityZone city={CITY.ทวารวดี} score={score} combo={combo} />
                        <CityZone city={CITY.ละโว้} score={score} combo={combo} />
                      </div>
                    </div>

                    <div className="rounded-[28px] bg-stone-900 p-5 text-white shadow-sm">
                      <h3 className="text-xl font-bold">เคล็ดลับจำง่าย</h3>
                      <div className="mt-3 space-y-2 text-sm text-white/85">
                        <div>ทวารวดี = นครปฐม, อู่ทอง, ธรรมจักร, ชาวมอญ</div>
                        <div>ละโว้ = ลพบุรี, ขอม, พระปรางค์สามยอด</div>
                      </div>
                      <div className="mt-4 rounded-2xl bg-white/10 p-3 text-sm text-white/80">
                        ตอบถูกติดกันหลายครั้งจะได้คอมโบ ช่วยเพิ่มความสนุกและแรงเชียร์ในห้องเรียน
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {state === "finished" && (
                <motion.div
                  key="finished"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid gap-5 lg:grid-cols-2"
                >
                  <div className="rounded-[28px] bg-stone-900 p-5 text-white shadow-sm">
                    <div className="flex items-center gap-2 text-amber-300">
                      <Trophy className="h-5 w-5" />
                      <span className="font-semibold">จบเกมแล้ว</span>
                    </div>
                    <h2 className="mt-4 text-3xl font-bold">{summary.title}</h2>
                    <p className="mt-2 text-white/80">คุณเก็บของได้ {score} / {total} ชิ้น</p>
                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <ResultBox label="คะแนน" value={score} />
                      <ResultBox label="แม่นยำ" value={`${summary.accuracy}%`} />
                      <ResultBox label="คอมโบสูงสุด" value={`x${bestCombo}`} />
                      <ResultBox label="เวลาเหลือ" value={`${timeLeft}s`} />
                    </div>
                  </div>

                  <div className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-stone-200">
                    <h3 className="text-xl font-bold">สรุปเนื้อหา</h3>
                    <div className="mt-3 space-y-3 text-sm leading-7 text-stone-700">
                      <div><b>ทวารวดี</b>: นครปฐม-อู่ทอง, ชาวมอญ, พุทธเถรวาทและมหายาน, ธรรมจักรศิลาพร้อมกวางหมอบ</div>
                      <div><b>ละโว้</b>: ลพบุรี, ได้รับอิทธิพลขอม, พราหมณ์-ฮินดูและพุทธมหายาน, พระปรางค์สามยอด</div>
                    </div>
                    <div className="mt-5 flex gap-3">
                      <Button onClick={startGame} className="h-12 flex-1 rounded-2xl">
                        เล่นอีกครั้ง
                      </Button>
                      <Button variant="outline" onClick={resetGame} className="h-12 flex-1 rounded-2xl">
                        <RotateCcw className="mr-2 h-4 w-4" /> รีเซ็ต
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value, icon }) {
  return (
    <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-stone-200">
      <div className="flex items-center gap-2 text-xs text-stone-500">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-xl font-bold">{value}</div>
    </div>
  );
}

function MiniCard({ icon, text }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3 text-center">
      <div className="text-2xl">{icon}</div>
      <div className="mt-1 text-xs font-semibold text-stone-700">{text}</div>
    </div>
  );
}

function CityPreview({ city }) {
  return (
    <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
      <div className="text-3xl">{city.emoji}</div>
      <div className="mt-2 text-lg font-bold">{city.name}</div>
      <div className="mt-1 text-xs text-white/75">{city.desc}</div>
    </div>
  );
}

function CityZone({ city, score, combo }) {
  return (
    <div className={cn("rounded-[24px] p-4 text-white shadow-sm bg-gradient-to-br", city.color)}>
      <div className="flex items-center justify-between">
        <div className="text-3xl">{city.emoji}</div>
        <Badge className="rounded-full bg-white/15 text-white hover:bg-white/15">โซนรับของ</Badge>
      </div>
      <div className="mt-3 text-xl font-bold">{city.name}</div>
      <div className="mt-1 text-sm text-white/80">{city.desc}</div>
      <div className="mt-4 flex items-center gap-3 text-sm text-white/90">
        <div className="rounded-2xl bg-white/10 px-3 py-2">คะแนน {score}</div>
        <div className="rounded-2xl bg-white/10 px-3 py-2">คอมโบ x{combo}</div>
      </div>
    </div>
  );
}

function ActionButton({ city, onClick, icon }) {
  return (
    <Button
      onClick={onClick}
      className={cn(
        "h-20 rounded-[24px] px-4 text-left text-white shadow-md transition-transform active:scale-[0.98]",
        "bg-gradient-to-r",
        city.color
      )}
    >
      <div className="flex w-full items-center justify-between gap-3">
        <div>
          <div className="text-sm text-white/80">ส่งไปเมือง</div>
          <div className="text-2xl font-bold">{city.name}</div>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">{icon}</div>
      </div>
    </Button>
  );
}

function ResultBox({ label, value }) {
  return (
    <div className="rounded-2xl bg-white/10 p-4">
      <div className="text-white/60 text-sm">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}
