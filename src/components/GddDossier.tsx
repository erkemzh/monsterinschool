import React, { useState } from 'react';
import { 
  FileText, 
  Ghost, 
  MapPin, 
  Flame, 
  ShieldAlert, 
  Compass, 
  Volume2, 
  Copy, 
  Check, 
  Sparkles,
  ChevronRight,
  Eye,
  Sliders,
  Play,
  Download
} from 'lucide-react';

interface GddDossierProps {
  onStartGame: () => void;
  onClose?: () => void;
  onDownloadGame?: () => void;
}

export const GddDossier: React.FC<GddDossierProps> = ({ onStartGame, onClose, onDownloadGame }) => {
  const [activeTab, setActiveTab] = useState<'lore' | 'physics' | 'ai' | 'level' | 'walkthrough' | 'prompts'>('lore');
  const [copiedPrompt, setCopiedPrompt] = useState<number | null>(null);

  const copyPromptText = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedPrompt(index);
    setTimeout(() => setCopiedPrompt(null), 2000);
  };

  return (
    <div className="relative w-full min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Top Bar following contract */}
      <header className="h-16 px-6 md:px-12 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <span className="font-cinzel text-lg md:text-xl font-bold tracking-wider text-red-500 uppercase">
            Проклятый Флигель
          </span>
          <span className="text-xs text-zinc-500 hidden sm:inline">· The Forgotten Wing GDD</span>
        </div>

        <nav className="hidden lg:flex items-center gap-6 text-xs uppercase tracking-widest text-zinc-400 font-medium">
          <button 
            onClick={() => setActiveTab('lore')} 
            className={`hover:text-red-400 transition-colors ${activeTab === 'lore' ? 'text-red-400 font-semibold underline underline-offset-4' : ''}`}
          >
            1. Завязка
          </button>
          <button 
            onClick={() => setActiveTab('physics')} 
            className={`hover:text-red-400 transition-colors ${activeTab === 'physics' ? 'text-red-400 font-semibold underline underline-offset-4' : ''}`}
          >
            2. Физика & Крафт
          </button>
          <button 
            onClick={() => setActiveTab('ai')} 
            className={`hover:text-red-400 transition-colors ${activeTab === 'ai' ? 'text-red-400 font-semibold underline underline-offset-4' : ''}`}
          >
            3. ИИ Охоты
          </button>
          <button 
            onClick={() => setActiveTab('level')} 
            className={`hover:text-red-400 transition-colors ${activeTab === 'level' ? 'text-red-400 font-semibold underline underline-offset-4' : ''}`}
          >
            4. Локации
          </button>
          <button 
            onClick={() => setActiveTab('walkthrough')} 
            className={`hover:text-red-400 transition-colors ${activeTab === 'walkthrough' ? 'text-red-400 font-semibold underline underline-offset-4' : ''}`}
          >
            5. Сценарий
          </button>
          <button 
            onClick={() => setActiveTab('prompts')} 
            className={`hover:text-red-400 transition-colors ${activeTab === 'prompts' ? 'text-red-400 font-semibold underline underline-offset-4' : ''}`}
          >
            6. Концепт-Арты
          </button>
        </nav>

        <div className="flex items-center gap-3">
          {onDownloadGame && (
            <button
              onClick={onDownloadGame}
              className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 transition-colors rounded flex items-center gap-2 cursor-pointer"
              title="Скачать готовый автономный файл всей игры (.html)"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              Скачать Игру (.html)
            </button>
          )}
          <button
            onClick={onStartGame}
            className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-zinc-950 bg-red-500 hover:bg-red-400 transition-colors rounded flex items-center gap-2 shadow-lg shadow-red-950/50 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Играть в Хоррор 3D
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10">
        {/* Editorial Subtitle without pills */}
        <div className="mb-10 border-b border-zinc-900 pb-8">
          <div className="flex items-center gap-3 text-xs text-zinc-500 mb-2 uppercase tracking-widest font-mono">
            <span>Production Game Design Document</span>
            <span>·</span>
            <span>Survival Horror / Immersive Sim</span>
            <span>·</span>
            <span>First Person WebGL 3D</span>
          </div>
          <h1 className="font-cinzel text-3xl md:text-5xl font-extrabold text-zinc-100 tracking-tight leading-tight">
            «Проклятый Флигель» (The Forgotten Wing)
          </h1>
          <p className="mt-4 text-zinc-400 text-base md:text-lg max-w-3xl leading-relaxed">
            Полная техническая и геймплейная документация проекта хоррора на выживание. Реализация глубокой физической интерактивности, адаптивного ИИ-охотника и гнетущей психологической изоляции.
          </p>

          {/* Quick tab switchers for mobile */}
          <div className="flex flex-wrap gap-2 mt-6 lg:hidden">
            {[
              { id: 'lore', label: '1. Завязка' },
              { id: 'physics', label: '2. Физика' },
              { id: 'ai', label: '3. ИИ Охоты' },
              { id: 'level', label: '4. Локации' },
              { id: 'walkthrough', label: '5. Сценарий' },
              { id: 'prompts', label: '6. Арт-Промпты' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-3 py-1.5 text-xs rounded transition-colors ${
                  activeTab === tab.id ? 'bg-zinc-800 text-red-400 font-semibold' : 'bg-zinc-900/60 text-zinc-400'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* SECTION 1: LORE & CONTEXT */}
        {activeTab === 'lore' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-lg p-6 md:p-8">
              <div className="flex items-center gap-2 text-red-500 font-cinzel text-xl font-bold mb-4">
                <Flame className="w-5 h-5" />
                1. Завязка, Контекст и Психологическая Модель
              </div>
              <div className="prose prose-invert max-w-none text-zinc-300 space-y-4 text-sm md:text-base leading-relaxed">
                <p>
                  <strong>Завязка:</strong> Ноябрь 1989 года. Старый кирпичный учебный корпус (Флигель №3), законсервированный после необъяснимой гибели директора школы в 1974 году, десятилетиями стоял заколоченным. Группа старшеклассников-буллеров силой затаскивает протагониста — тихого десятиклассника Арсения — в темный актовый зал флигеля, чтобы «проверить его смелость» и заставить зачитать древний текст из найденной в архиве тетради.
                </p>
                <p>
                  Ритуал неожиданно срабатывает. Лампочки лопаются дождем искр, пол сотрясает первобытный холод, а из глубин школьной вентиляции вырывается безглазая бестелесная сущность — Тень Завуча (The Warden). Обидчики с воплями бросаются к выходу, но внешние дубовые двери захлопываются намертво: сквозь замочную скважину игрок слышит звуки жестокой расправы над мучителями. Воцаряется гробовая тишина. Арсений остается абсолютно один в лабиринте коридоров.
                </p>
                <div className="border-l-2 border-red-500/60 pl-4 py-1 text-zinc-400 italic">
                  «Оно не просто убивает. Оно упивается страхом, прислушивается к каждому скрипу половицы и учится на твоих попытках спрятаться.»
                </div>
                <p>
                  <strong>Главная цель игрока:</strong> Не вступать в прямой бой (у героя нет оружия), а выжить, собрать 4 сакральные реликвии (Оккультный мел, Очистительную соль, Ключ директора и Боёк школьного звонка), запитать электрощиток котельной и провести ритуал экзорцизма в алтарном круге, чтобы снять печати с главных ворот.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 bg-zinc-900/30 border border-zinc-800/60 rounded">
                <h4 className="font-semibold text-zinc-200 mb-2">Атмосферный Тон</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Психологический клаустрофобный хоррор в традициях Amnesia: The Dark Descent и Alien: Isolation. Безысходность, скрип советского паркета, запах сырости и постоянное ощущение чьего-то взгляда в спину.
                </p>
              </div>
              <div className="p-5 bg-zinc-900/30 border border-zinc-800/60 rounded">
                <h4 className="font-semibold text-zinc-200 mb-2">Штраф за Ошибки</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Один контакт с призраком во время Охоты фатален. Игрок должен учиться предугадывать маршрут сущности по звукам эха и миганию ламп накаливания.
                </p>
              </div>
              <div className="p-5 bg-zinc-900/30 border border-zinc-800/60 rounded">
                <h4 className="font-semibold text-zinc-200 mb-2">Управление Вниманием</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Фонарик питается от дефицитных батареек. Полная темнота спасает от визуального обнаружения, но стремительно снижает рассудок героя, вызывая слуховые галлюцинации.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: PHYSICAL INTERACTION SYSTEM */}
        {activeTab === 'physics' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-lg p-6 md:p-8">
              <div className="flex items-center gap-2 text-red-500 font-cinzel text-xl font-bold mb-4">
                <Sliders className="w-5 h-5" />
                2. Интерактивность и Исследование (Physical Interaction System)
              </div>
              <div className="text-zinc-300 space-y-5 text-sm md:text-base leading-relaxed">
                <p>
                  В отличие от статичных скриптовых хорроров, «Проклятый Флигель» базируется на парадигме <strong>тотальной физической манипуляции окружением</strong> (Physics-driven Immersive Sim):
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <div className="p-4 bg-zinc-950/60 border border-zinc-800 rounded">
                    <h4 className="text-red-400 font-semibold mb-2">Плавная Механика Дверей и «Щелка»</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Двери открываются не дискретным кликом, а удержанием и движением курсора мыши. Игрок может приоткрыть дверь всего на 5–10 сантиметров, чтобы осторожно заглянуть в коридор, оценить мерцание ламп и послушать шаги призрака, не производя предательского хлопка.
                    </p>
                  </div>

                  <div className="p-4 bg-zinc-950/60 border border-zinc-800 rounded">
                    <h4 className="text-red-400 font-semibold mb-2">Система Баррикад из Мебели</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Любую закрытую дверь кабинета можно укрепить: подпереть учительской партой, заклинить ручку стулом или заколотить доской. Баррикада выдерживает от 2 до 4 ударов ярости призрака (сопровождаясь треском щепок), давая драгоценные секунды, чтобы забиться в шкаф.
                    </p>
                  </div>

                  <div className="p-4 bg-zinc-950/60 border border-zinc-800 rounded">
                    <h4 className="text-red-400 font-semibold mb-2">Акустическое Отвлечение (Throwables)</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Любой незакрепленный предмет — химическая колба, кружка, глобус, советский чугунный утюг или том словаря Даля — подбирается в руки. Бросок предмета в противоположный конец коридора или в окно создает звуковую волну громкостью до 85 дБ, перенаправляя внимание ИИ в сторону удара.
                    </p>
                  </div>

                  <div className="p-4 bg-zinc-950/60 border border-zinc-800 rounded">
                    <h4 className="text-red-400 font-semibold mb-2">Шкафы и Контроль Дыхания</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Школьные шкафы и пространство под партами — единственные укрытия. Забравшись в шкаф, игрок видит мир через щели деревянных дверок. Когда призрак проходит рядом, включается мини-игра удержания дыхания (Hold Breath): задержка сбивает шум сердцебиения до 0 дБ, но шкала кислорода тает.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 3: DYNAMIC AI HUNT SYSTEM */}
        {activeTab === 'ai' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-lg p-6 md:p-8">
              <div className="flex items-center gap-2 text-red-500 font-cinzel text-xl font-bold mb-4">
                <Ghost className="w-5 h-5" />
                3. Динамическая Система Охоты (AI Hunt & Stealth State Machine)
              </div>
              <p className="text-zinc-300 text-sm md:text-base leading-relaxed mb-6">
                Поведение сущности моделируется через иерархическое дерево состояний (Behavior Tree) с сенсорной подсистемой слуха и зрения. Никаких телепортаций за спину игрока — только честное физическое патрулирование:
              </p>

              <div className="space-y-4">
                <div className="p-4 bg-zinc-950/70 border-l-4 border-emerald-500 rounded">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-emerald-400 text-sm">State 1: Wandering (Пассивный Поиск)</span>
                    <span className="text-xs text-zinc-500 font-mono">Скорость: 2.0 м/с · Радиус слуха: 15 м</span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                    Сущность патрулирует ключевые узлы флигеля, случайным образом хлопает форточками, перемещает мелкие предметы, заставляет нити накаливания в лампах тихо гудеть. Если игрок крадется на корточках, призрак не знает его координат.
                  </p>
                </div>

                <div className="p-4 bg-zinc-950/70 border-l-4 border-amber-500 rounded">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-amber-400 text-sm">State 2: Investigating (Расследование Шума)</span>
                    <span className="text-xs text-zinc-500 font-mono">Скорость: 3.2 м/с · Реакция на звук</span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                    Срабатывает от бега игрока (Sprint: 40 noise), разбитой колбы (85 noise) или щелчка выключателя. Призрак быстрым шагом направляется к эпицентру звука, осматривает углы и проверяет дверные проемы.
                  </p>
                </div>

                <div className="p-4 bg-zinc-950/70 border-l-4 border-red-600 rounded">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-red-500 text-sm">State 3: Active Hunt (Кровавая Охота)</span>
                    <span className="text-xs text-zinc-500 font-mono">Скорость: 4.4 м/с · Длительность: 20-30 сек</span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                    Триггеры: прямой луч фонарика в лицо сущности, взятие квестовой реликвии или накопление шума свыше 70%. Начинаются сильные визуальные аберрации, свет гаснет или мигает алым, слышен тяжелый металлический скрежет. Призрак выбивает двери, проверяет шкафы и убивает при прямом контакте.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 4: LOCATION STRUCTURE */}
        {activeTab === 'level' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-lg p-6 md:p-8">
              <div className="flex items-center gap-2 text-red-500 font-cinzel text-xl font-bold mb-4">
                <MapPin className="w-5 h-5" />
                4. Структура Локации: Школьный Флигель №3
              </div>
              <p className="text-zinc-300 text-sm md:text-base leading-relaxed mb-6">
                Архитектура флигеля спроектирована по принципу «кольцевых коридоров» (Looping Level Design), чтобы игрок всегда имел возможность обойти преследующую его сущность:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-zinc-950/50 border border-zinc-800 rounded">
                  <h4 className="font-semibold text-zinc-200 text-sm mb-1">Сектор 1: Учебные Классы (Литература и История)</h4>
                  <span className="text-xs text-zinc-500 block mb-2 font-mono">Опасность: Низкая · Укрытий: Много</span>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Ряды деревянных парт, опрокинутые стулья, следы советских лозунгов на пожелтевших обоях. Здесь спрятан Оккультный мел и первый шкаф для укрытия. Идеальная стартовая зона для освоения скрытности.
                  </p>
                </div>

                <div className="p-4 bg-zinc-950/50 border border-zinc-800 rounded">
                  <h4 className="font-semibold text-zinc-200 text-sm mb-1">Сектор 2: Химическая и Физическая Лаборатории</h4>
                  <span className="text-xs text-zinc-500 block mb-2 font-mono">Опасность: Средняя · Ресурсы: Максимум</span>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Массивные каменные столы с керамическими раковинами. Множество стеклянных колб для бросков и отвлечения. В вытяжном шкафу хранится Соль очищения. Стеклянный пол под ногами легко выдает позицию игрока.
                  </p>
                </div>

                <div className="p-4 bg-zinc-950/50 border border-zinc-800 rounded">
                  <h4 className="font-semibold text-zinc-200 text-sm mb-1">Сектор 3: Библиотека и Актовый Зал</h4>
                  <span className="text-xs text-zinc-500 block mb-2 font-mono">Опасность: Высокая · Укрытий: Минимально</span>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Огромное открытое пространство с высокими книжными стеллажами, создающими слепые зоны. Призрак обожает загонять жертву в угол между шкафами. В картотеке директора спрятан Старинный ключ.
                  </p>
                </div>

                <div className="p-4 bg-zinc-950/50 border border-zinc-800 rounded">
                  <h4 className="font-semibold text-zinc-200 text-sm mb-1">Сектор 4: Подвал, Котельная и Алтарный Зал</h4>
                  <span className="text-xs text-zinc-500 block mb-2 font-mono">Опасность: Критическая · Очаг Проклятия</span>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Лабиринт из ржавых паровых труб, капающая вода и тяжелый запах гари. Здесь находится электрощиток, питающий школьные системы, и кровавый ритуальный круг, где проводится финальный экзорцизм.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 5: 5-MINUTE PLAYTHROUGH SCENARIO */}
        {activeTab === 'walkthrough' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-lg p-6 md:p-8">
              <div className="flex items-center gap-2 text-red-500 font-cinzel text-xl font-bold mb-4">
                <Compass className="w-5 h-5" />
                5. Пример Игровой Сессии: 5 Минут Чистого Саспенса
              </div>
              <div className="space-y-6 text-sm text-zinc-300 leading-relaxed">
                <div className="flex gap-4">
                  <span className="font-mono text-red-500 font-bold shrink-0">00:00 - 01:15</span>
                  <div>
                    <h5 className="font-semibold text-zinc-100">Проникновение в Лабораторию</h5>
                    <p className="text-xs text-zinc-400 mt-1">
                      Арсений на корточках пробирается по темному коридору. Луч фонарика выхватывает пыльные витрины с чучелами птиц. Герой заходит в кабинет химии, тихо прикрывая дверь за собой. Обыскивает ящики лаборантской в поисках соли. Случайно задевает локтем пустую мензурку — та падает со стола и разбивается вдребезги о кафель.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <span className="font-mono text-red-500 font-bold shrink-0">01:15 - 02:30</span>
                  <div>
                    <h5 className="font-semibold text-zinc-100">Зов Бездны и Запуск Охоты</h5>
                    <p className="text-xs text-zinc-400 mt-1">
                      Шум разносится эхом по всему крылу. В коридоре гаснут лампы. Раздается глухой утробный вздох, а затем тяжелые, неестественно быстрые шаги. Пульс героя подскакивает до 140 ударов в минуту. Понимая, что бежать поздно, Арсений хватает тяжелый стул и вклинивает его под дверную ручку.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <span className="font-mono text-red-500 font-bold shrink-0">02:30 - 03:45</span>
                  <div>
                    <h5 className="font-semibold text-zinc-100">Штурм Баррикады и Укрытие в Шкафу</h5>
                    <p className="text-xs text-zinc-400 mt-1">
                      Через секунду в дверь с оглушительным треском врезается невидимая сила. Дерево стонет, стул трещит по швам. Игрок бросается к старому шкафу в углу класса, ныряет внутрь и захлопывает створку. В этот же момент дверь вылетает с петель, и темный силуэт с горящими белками глаз медленно вплывает в комнату.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <span className="font-mono text-red-500 font-bold shrink-0">03:45 - 05:00</span>
                  <div>
                    <h5 className="font-semibold text-zinc-100">Контроль Дыхания и Спасительный Маневр</h5>
                    <p className="text-xs text-zinc-400 mt-1">
                      Игрок зажимает пробел, задерживая дыхание. Полоска кислорода стремительно тает. Призрак задерживается прямо перед шкафом — через щель видны когтистые смоляные пальцы. В последний момент, когда воздух в легких почти на нуле, сущность теряет интерес и уходит обратно в коридор. Герой жадно хватает ртом воздух, подбирает соль и растворяется в тенях.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 6: CONCEPT ART PROMPTS & GENERATED VISUALS */}
        {activeTab === 'prompts' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-lg p-6 md:p-8">
              <div className="flex items-center gap-2 text-red-500 font-cinzel text-xl font-bold mb-4">
                <Sparkles className="w-5 h-5" />
                6. Концепт-Арты (Midjourney / DALL-E) и Визуальное Видение
              </div>
              <p className="text-zinc-300 text-sm md:text-base leading-relaxed mb-8">
                Ниже представлены 3 детализированных англоязычных промпта кинематографического уровня, оптимизированных для генераторов изображений, а также готовые отрендеренные концепт-арты игры:
              </p>

              <div className="space-y-10">
                {/* Prompt 1 */}
                <div className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-950/60">
                  <div className="aspect-video w-full overflow-hidden bg-zinc-900 relative">
                    <img 
                      src="/src/assets/images/first_person_closet_1791380642871.jpg" 
                      alt="First person closet view" 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                    <div className="absolute top-3 left-3 px-3 py-1 bg-black/80 backdrop-blur text-[11px] font-mono text-zinc-300 rounded">
                      Concept 1 · First-Person Hiding & Exploration
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-zinc-100 text-sm">
                        Вид от первого лица: рука с фонариком открывает шкаф
                      </h4>
                      <button
                        onClick={() => copyPromptText(
                          "First-person view of a trembling hand holding a dim brass flashlight cutting through dusty darkness, cautiously prying open the creaking door of an old tall wooden school locker in a decayed Soviet classroom, pitch black shadows, peeling teal paint, dust motes in the beam, eerie psychological survival horror, cinematic 8k, Unreal Engine 5 render style.", 
                          1
                        )}
                        className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 px-2.5 py-1 bg-red-950/40 rounded transition-colors"
                      >
                        {copiedPrompt === 1 ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedPrompt === 1 ? 'Скопировано!' : 'Копировать Промпт'}
                      </button>
                    </div>
                    <pre className="text-xs text-zinc-400 font-mono bg-zinc-900/90 p-3 rounded overflow-x-auto whitespace-pre-wrap border border-zinc-800">
First-person view of a trembling hand holding a dim brass flashlight cutting through dusty darkness, cautiously prying open the creaking door of an old tall wooden school locker in a decayed Soviet classroom, pitch black shadows, peeling teal paint, dust motes in the beam, eerie psychological survival horror, cinematic 8k, Unreal Engine 5 render style.
                    </pre>
                  </div>
                </div>

                {/* Prompt 2 */}
                <div className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-950/60">
                  <div className="aspect-video w-full overflow-hidden bg-zinc-900 relative">
                    <img 
                      src="/src/assets/images/ghost_breaking_barricade_1791380664425.jpg" 
                      alt="Ghost breaking barricade" 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                    <div className="absolute top-3 left-3 px-3 py-1 bg-black/80 backdrop-blur text-[11px] font-mono text-zinc-300 rounded">
                      Concept 2 · Active Ghost Hunt & Barricade Destruction
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-zinc-100 text-sm">
                        Призрак, разрушающий баррикаду из парт в дверном проеме
                      </h4>
                      <button
                        onClick={() => copyPromptText(
                          "Cinematic survival horror scene: a towering horrifying shadowy apparition with hollow glowing white eyes and distorted smoke tendrils violently shattering a makeshift barricade of wooden school desks and rusty chairs wedged in a narrow dark school corridor, flickering emergency red lights, splintering wood flying, extreme tension, photorealistic dark atmosphere.", 
                          2
                        )}
                        className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 px-2.5 py-1 bg-red-950/40 rounded transition-colors"
                      >
                        {copiedPrompt === 2 ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedPrompt === 2 ? 'Скопировано!' : 'Копировать Промпт'}
                      </button>
                    </div>
                    <pre className="text-xs text-zinc-400 font-mono bg-zinc-900/90 p-3 rounded overflow-x-auto whitespace-pre-wrap border border-zinc-800">
Cinematic survival horror scene: a towering horrifying shadowy apparition with hollow glowing white eyes and distorted smoke tendrils violently shattering a makeshift barricade of wooden school desks and rusty chairs wedged in a narrow dark school corridor, flickering emergency red lights, splintering wood flying, extreme tension, photorealistic dark atmosphere.
                    </pre>
                  </div>
                </div>

                {/* Prompt 3 */}
                <div className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-950/60">
                  <div className="aspect-video w-full overflow-hidden bg-zinc-900 relative">
                    <img 
                      src="/src/assets/images/abandoned_classroom_1791380679853.jpg" 
                      alt="Abandoned classroom" 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                    <div className="absolute top-3 left-3 px-3 py-1 bg-black/80 backdrop-blur text-[11px] font-mono text-zinc-300 rounded">
                      Concept 3 · Atmospheric Environmental Storytelling
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-zinc-100 text-sm">
                        Заброшенный кабинет с физическими деталями и разрухой
                      </h4>
                      <button
                        onClick={() => copyPromptText(
                          "Dark atmospheric abandoned Soviet school chemistry laboratory at night, overturned desks, shattered glass beakers and occult chalk markings glowing dimly on blackboards, moonlight cutting through broken barred windows, foggy eerie mist on floorboards, AAA survival horror game environment aesthetic, hyperdetailed.", 
                          3
                        )}
                        className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 px-2.5 py-1 bg-red-950/40 rounded transition-colors"
                      >
                        {copiedPrompt === 3 ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedPrompt === 3 ? 'Скопировано!' : 'Копировать Промпт'}
                      </button>
                    </div>
                    <pre className="text-xs text-zinc-400 font-mono bg-zinc-900/90 p-3 rounded overflow-x-auto whitespace-pre-wrap border border-zinc-800">
Dark atmospheric abandoned Soviet school chemistry laboratory at night, overturned desks, shattered glass beakers and occult chalk markings glowing dimly on blackboards, moonlight cutting through broken barred windows, foggy eerie mist on floorboards, AAA survival horror game environment aesthetic, hyperdetailed.
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom CTA to launch playable game */}
        <div className="mt-12 p-8 border border-red-900/60 bg-gradient-to-r from-red-950/30 via-zinc-900 to-zinc-950 rounded-xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
          <div>
            <span className="text-xs uppercase tracking-widest text-red-500 font-mono">Ready to play prototype</span>
            <h3 className="font-cinzel text-xl md:text-2xl font-bold text-zinc-100 mt-1">
              Испытать «Проклятый Флигель» вживую
            </h3>
            <p className="text-xs md:text-sm text-zinc-400 mt-2 max-w-xl">
              Полноценная 3D-игра от первого лица со всеми механиками GDD: фонарик, шум шагов, шкафы-укрытия, физический бросок колб для отвлечения и непредсказуемый ИИ-призрак.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {onDownloadGame && (
              <button
                onClick={onDownloadGame}
                className="px-6 py-3.5 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-600/50 text-amber-200 font-semibold text-sm uppercase tracking-wider rounded flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap shadow-lg shadow-amber-950/40"
              >
                <Download className="w-4 h-4 text-amber-400" />
                Скачать Файл (.html)
              </button>
            )}
            <button
              onClick={onStartGame}
              className="px-8 py-3.5 bg-red-600 hover:bg-red-500 text-white font-semibold text-sm uppercase tracking-wider rounded shadow-lg shadow-red-950 cursor-pointer flex items-center gap-2 whitespace-nowrap transition-transform hover:scale-105 active:scale-95"
            >
              <Play className="w-4 h-4 fill-current" />
              Начать Игру (WebGL 3D)
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
