// Localization. English source strings are the keys; the language is read
// once from Playgama Bridge (platform.language) after initialization.
export let lang='en';

export function setLanguage(code){
  const base=String(code||'en').toLowerCase().split(/[-_]/)[0];
  lang=base==='ru'?'ru':'en';
  document.documentElement.lang=lang;
  const label=document.getElementById('load-progress');if(label&&!label.textContent)label.textContent=t('Loading…');
    return lang;
}
// Cyrillic glyphs live in separate font faces; request them before the first frame.
export function loadFonts(){
  const sample=lang==='ru'?'AaЯя':'Aa';
  return Promise.allSettled(['900 24px Nunito','800 18px Nunito'].map(font=>document.fonts.load(font,sample)));
}

const plural=(n,one,few,many)=>{const a=Math.abs(Number(n))%100,b=a%10;return a>10&&a<20?many:b===1?one:b>=2&&b<=4?few:many;};
const coins=n=>`${n} ${plural(n,'монета','монеты','монет')}`;
const COINS=n=>coins(n).toUpperCase();

const RU=new Map(Object.entries({
  // Loading and errors
  'Loading…':'Загрузка…',
  'TRY AGAIN':'ЕЩЁ РАЗ',
  'RELOAD':'ПЕРЕЗАГРУЗИТЬ',
  'Could not load all levels. Please try again.':'Не удалось загрузить уровни. Попробуй ещё раз.',
  'Progress not saved yet. Tap to retry.':'Прогресс ещё не сохранён. Нажми, чтобы повторить.',
  'Could not open the spa. Please refresh to try again.':'Не удалось открыть спа. Обнови страницу и попробуй снова.',
  'Could not load your progress. Please try again.':'Не удалось загрузить прогресс. Попробуй ещё раз.',
  'Could not start the game. Please reload to try again.':'Не удалось запустить игру. Перезагрузи страницу и попробуй снова.',

  // Main menu and HUD
  'SPA PASS':'СПА-ПРОПУСК','RESTART':'ЗАНОВО','REPLAY':'ЕЩЁ РАЗ','BACK':'НАЗАД','LEVELS':'УРОВНИ','NEXT':'ДАЛЕЕ','FINISH':'ГОТОВО',
  'Back to the game':'Вернуться в игру','Settings':'Настройки','Open coin boutique':'Открыть монетную лавку',
  'Daily rewards':'Ежедневные награды','Lucky wheel':'Колесо удачи','Daily Gifts':'Подарки дня','Lucky Spin':'Колесо удачи',
  'PLAY AGAIN':'ИГРАТЬ СНОВА','PLAY':'ИГРАТЬ','MY GIFTS':'ПОДАРКИ','CARDS':'КАРТЫ',
  'Previous five levels':'Предыдущие пять уровней','Next five levels':'Следующие пять уровней',
  'BONUS':'БОНУС','Bonus games':'Бонусные игры','Mute sound':'Выключить звук','Enable sound':'Включить звук',
  'Pause game':'Пауза','Get a hint':'Подсказка','SKIP':'ПРОПУСК','RETRY':'ЗАНОВО','Rewarded spa items':'Спа-предметы за награды',
  'STYLE':'СТИЛЬ','Open level album':'Открыть альбом уровней','Sound on':'Звук вкл.','Sound off':'Звук выкл.',
  'Almost there!':'Почти получилось!','A fresh shuffle. You can do this!':'Перемешаем заново. У тебя получится!',
  'Paused':'Пауза','Close settings':'Закрыть настройки','RESUME':'ПРОДОЛЖИТЬ',
  'Level complete!':'Уровень пройден!','Beautiful again!':'Снова прекрасно!','TRIPLED!':'УТРОЕНО!','CLAIM x3':'ЗАБРАТЬ x3',
  'All ritual stars already collected':'Все звёзды ритуала уже собраны','BONUS GAME':'БОНУС-ИГРА','All levels':'Все уровни',
  'Perfect care!':'Идеальный уход!','Your stars':'Твои звёзды','Back to the level album':'Назад к альбому уровней',

  // Card album
  'Achievement Cards':'Карты достижений','Achievement card collection. Scroll to explore.':'Коллекция карт достижений. Прокрути, чтобы посмотреть.',
  'Collected':'Собрано','Scroll cards up':'Прокрутить карты вверх','Scroll cards down':'Прокрутить карты вниз',

  // Economy and rewards
  '3 hints':'3 подсказки','2 stage skips':'2 пропуска этапа','Gift box':'Подарок',
  '3 HINTS':'3 ПОДСКАЗКИ','2 STAGE SKIPS':'2 ПРОПУСКА ЭТАПА','GIFT BOX':'ПОДАРОК',
  'Rose Bow':'Розовый бант','Adds a pink bow to your character or creation.':'Добавляет розовый бантик персонажу или творению.',
  'Golden Butterfly':'Золотая бабочка','Decorates your finished look with a golden charm.':'Украшает готовый образ золотым талисманом.',
  'Royal Serum':'Королевская сыворотка','Turns the skincare dropper and serum drops gold.':'Делает пипетку и капли сыворотки золотыми.',
  'Berry Lovely':'Ягодная прелесть','Jade Master':'Мастер нефрита','Spa Royalty':'Королева спа',
  'Finish the 7-reward Spa Pass':'Получи все 7 наград Спа-пропуска','Lucky Charm':'Талисман удачи',
  'Find in a box or on the wheel':'Найди в подарке или на колесе','Seven Sweet Days':'Семь чудесных дней',
  'Claim the seventh daily gift':'Забери седьмой ежедневный подарок',
  '2 hints':'2 подсказки','The self-care collection':'Коллекция заботы о себе','2 skips':'2 пропуска','Royal spa bundle':'Королевский спа-набор',
  '1 hint':'1 подсказка','1 box':'1 подарок','1 skip':'1 пропуск','Card':'Карта',
  'Bubble Garden':'Сад пузырей','Pop a little garden of pearly bubbles.':'Лопни целый сад жемчужных пузырьков.',
  'Tap every bubble. Enjoy each little pop.':'Нажимай на каждый пузырёк. Наслаждайся каждым «чпок».',
  'Zen Stones':'Дзен-камни','Find your balance, one smooth stone at a time.':'Найди равновесие — камешек за камешком.',
  'Tap STACK when the stone is over the center.':'Нажми «ПОЛОЖИТЬ», когда камень над центром.',

  // Engagement
  'CLAIM':'ЗАБРАТЬ','Thanks for playing!':'Спасибо, что играешь!','Your next gift is on its way.':'Следующий подарок уже в пути.',
  'Gift for time in game':'Подарок за время в игре','Your level treasure':'Сокровище за уровни','A gift for your time':'Подарок за твоё время',
  '5 levels complete!':'5 уровней пройдено!','3 random rewards inside':'Внутри 3 случайные награды','Your gift is ready!':'Подарок готов!',
  'Coins, hints, skips and special gifts.':'Монеты, подсказки, пропуски и особые подарки.',
  'Watch a video to collect this gift.':'Посмотри видео, чтобы забрать подарок.','This gift is free to collect.':'Этот подарок можно забрать бесплатно.',
  'WATCH & CLAIM':'СМОТРЕТЬ И ЗАБРАТЬ','SKIP THIS CHEST':'ПРОПУСТИТЬ СУНДУК','Tap here to close':'Нажми, чтобы закрыть',
  'Skipping loses this chest permanently.':'Если пропустить, сундук пропадёт навсегда.','Your treasure!':'Твоё сокровище!',
  'LOVELY!':'ЧУДЕСНО!','100% - CHEST READY':'100% — СУНДУК ГОТОВ','Open earned chest':'Открыть заработанный сундук',

  // Meta controller
  'Try again soon':'Попробуй чуть позже','The video is unavailable. Nothing was spent.':'Видео недоступно. Ничего не потрачено.',
  'A little reason to come back tomorrow.':'Маленький повод вернуться завтра.','A little more sparkle':'Ещё немного блеска',
  'Ready for your next ritual':'Всё готово к следующему ритуалу','The royal collection!':'Королевская коллекция!',
  'Spa Pass reward!':'Награда Спа-пропуска!','A new ritual awaits':'Новый ритуал ждёт','Level unlocked!':'Уровень открыт!',
  'Permanently unlocked!':'Открыт навсегда!','Your shelter is working. Wait for the swarm.':'Укрытие работает. Дождись роя.',
  'Let the cards finish turning, then ask for a hint.':'Дождись, пока карточки перевернутся, и попроси подсказку.',
  'Your new spa look':'Твой новый спа-образ','Equipped! Your item stays in your collection.':'Надето! Предмет остаётся в твоей коллекции.',
  'Triple the glow!':'Тройное сияние!','A surprise for you':'Сюрприз для тебя','Open your gift in the Gift Boxes room.':'Открой подарок в разделе «Подарки».',
  'Lucky you!':'Вот это удача!','A lovely surprise':'Чудесный сюрприз','Your rewards are already safe in your collection.':'Награды уже в твоей коллекции.',
  'Almost! Try the center.':'Почти! Целься в центр.','Beautiful balance!':'Прекрасный баланс!','A moment of zen':'Минутка дзена',

  // Meta screens
  'Back':'Назад','Little luxuries':'Маленькие радости','Daily gifts':'Ежедневные подарки','A gift every day':'Подарок каждый день',
  'Lucky spin':'Колесо удачи','Twelve lovely prizes':'Двенадцать чудесных призов','Gift boxes':'Подарки','Coin boutique':'Монетная лавка',
  'Free coins & rituals':'Бесплатные монеты и ритуалы','A little playful break':'Игривый перерыв','Spa wardrobe':'Спа-гардероб',
  'Make it your own':'Сделай по-своему','Daily Rewards':'Ежедневные награды','Day 7 · Mega Bundle':'День 7 · Мега-набор',
  'A little gift, just for you.':'Маленький подарок специально для тебя.','Next gift after the daily reset':'Следующий подарок после ежедневного сброса',
  'COME BACK SOON':'ВОЗВРАЩАЙСЯ ПОЗЖЕ','Spa Pass':'Спа-пропуск','Royal Spa Bundle':'Королевский спа-набор',
  'Your royal collection is complete!':'Королевская коллекция собрана!','PASS COMPLETE':'ПРОПУСК ЗАВЕРШЁН',
  'Spin the wheel,':'Крути колесо,','unlock your glow!':'открой своё сияние!','SPIN':'КРУТИТЬ','SPINNING...':'КРУТИТСЯ...',
  'A little luck. A lovely surprise.':'Немного удачи. Чудесный сюрприз.',
  'Gift Boxes':'Подарки','OPEN GIFT':'ОТКРЫТЬ','OPENING...':'ОТКРЫВАЕМ...','GET A GIFT':'ПОЛУЧИТЬ ПОДАРОК',
  'Coin Boutique':'Монетная лавка','1 completed video':'1 просмотренное видео','Prices in coins. Supplies are used once.':'Цены в монетах. Припасы одноразовые.',
  'UNLOCK RITUALS':'ОТКРЫТЬ РИТУАЛЫ','Unlock Rituals':'Открыть ритуалы','Unlocked':'Открыт','VIP - Watch video':'VIP — за видео',
  'Play in order for free, or unlock any ritual with coins.':'Играй по порядку бесплатно или открой любой ритуал за монеты.',
  'This ritual is yours.':'Этот ритуал твой.','Choose your way to unlock':'Выбери способ открыть','WATCH & UNLOCK':'СМОТРЕТЬ И ОТКРЫТЬ',
  '1 video · this level is yours forever':'1 видео · уровень твой навсегда','Or use your coins':'Или потрать монеты','LUCKY SPIN':'КОЛЕСО УДАЧИ',
  '1 video · 1 spin · a surprise reward':'1 видео · 1 вращение · награда-сюрприз','MORE CARDS':'ЕЩЁ КАРТЫ','COLLECTED':'СОБРАНО',
  'TO DISCOVER':'ЕЩЁ НЕ НАЙДЕНО','Spa Wardrobe':'Спа-гардероб','Permanent cosmetic upgrades · Yours to keep':'Постоянные украшения · Остаются навсегда',
  'EQUIPPED':'НАДЕТО','WEAR IT':'НАДЕТЬ','UNLOCK':'ОТКРЫТЬ','CLASSIC LOOK':'КЛАССИЧЕСКИЙ ВИД','A gentle nudge':'Мягкая подсказка',
  'Skip this stage':'Пропустить этап','Watch a hand show you the next move.':'Рука покажет следующее движение.',
  'Finish this stage and keep your glow.':'Заверши этап и сохрани сияние.','USE A HINT':'ВЗЯТЬ ПОДСКАЗКУ','USE A SKIP':'ВЗЯТЬ ПРОПУСК',
  'WATCH FOR HINT':'ПОДСКАЗКА ЗА ВИДЕО','WATCH TO SKIP':'ПРОПУСК ЗА ВИДЕО','Little Escapes':'Минутки отдыха','Ready to play':'Можно играть',
  'Unlock with 1 video':'Открыть за 1 видео','Two bonus mini games. A little change of pace.':'Две бонусные мини-игры. Небольшая смена ритма.',
  'Watch 1 video to unlock this bonus game':'Посмотри 1 видео, чтобы открыть эту игру','PLAY & EARN':'ИГРАТЬ НА МОНЕТЫ','PLAY FOR FUN':'ИГРАТЬ ДЛЯ ДУШИ',
  'Free practice has no coin rewards.':'В свободной игре монеты не начисляются.','WATCH & EARN':'СМОТРЕТЬ И ЗАРАБОТАТЬ',
  'FREE PRACTICE - NO COINS':'СВОБОДНАЯ ИГРА — БЕЗ МОНЕТ','A lovely little break!':'Чудесный перерыв!','Pop bubble':'Лопнуть пузырь',
  'STACK':'ПОЛОЖИТЬ','Unlocked!':'Открыто!',

  // VIP access
  'MISSED':'ПРОПУЩЕНО','WATCH':'ОТКРЫТЬ','Missed permanently':'Пропущено навсегда','Play':'Играть','Watch a video to unlock':'Посмотри видео, чтобы открыть',
  'Your VIP Experience':'Твой VIP-уровень','Return without deciding':'Вернуться без выбора','VIP EXCLUSIVE':'VIP-ЭКСКЛЮЗИВ','PREMIUM':'ПРЕМИУМ',
  'This invitation was skipped permanently.':'Это приглашение пропущено навсегда.','Your VIP experience is permanently unlocked.':'Твой VIP-уровень открыт навсегда.',
  'Watch one video to keep this VIP experience forever.':'Посмотри одно видео, и VIP-уровень останется твоим навсегда.',
  'PLAY VIP':'ИГРАТЬ VIP','BACK TO LEVELS':'К УРОВНЯМ','SKIP FOREVER':'ПРОПУСТИТЬ НАВСЕГДА',
  'Skip this VIP level permanently':'Пропустить этот VIP-уровень навсегда','Skipping removes this level from your journey.':'Пропущенный уровень исчезнет из твоего пути.',

  // Reward effects
  'New card unlocked!':'Новая карта!','A new treasure for your collection.':'Новое сокровище для твоей коллекции.','KEEP IT':'ЗАБРАТЬ',

  // Tools and praise
  'Cleanser':'Пенка','Cotton pad':'Ватный диск','Mask brush':'Кисть для маски','Jade roller':'Нефритовый роллер','Serum':'Сыворотка',
  'Eye patches':'Патчи','Soft towel':'Мягкое полотенце','Fresh mist':'Свежий спрей','Fluffy brush':'Пушистая кисть','Lip tint':'Тинт для губ',
  'Eyeshadow':'Тени','Soft sponge':'Мягкий спонж',
  'Lovely touch!':'Чудесно!','So satisfying…':'Как приятно…','Looking fresh!':'Свежо выглядит!','A little more glow':'Ещё немного сияния',
  'Beautifully done!':'Прекрасно получилось!','Fresh & lovely!':'Свежо и чудесно!','Look at that glow!':'Посмотри, как сияет!',
  'Press & hold until the ring fills':'Нажми и держи, пока кольцо не заполнится','Start at the mint dot. Follow it slowly.':'Начни с мятной точки. Веди медленно.',
  'Grab a tab, then pull along the arrow':'Возьми за край и тяни по стрелке','Drag a patch to its dotted outline':'Перетащи патч на пунктирный контур',
  'Sweep over the sparkling areas':'Проведи по блестящим местам',

  // Facial levels
  'Fresh Start':'Свежий старт','A cloud-soft cleanse':'Нежное, как облачко, очищение','Melt the day away':'Смой усталость дня',
  'Sweep the cotton pad over every little mark.':'Проведи ватным диском по каждому пятнышку.','Make a little foam':'Взбей немного пены',
  'Rub gentle circles to lather up the cleanser.':'Мягко води по кругу, чтобы вспенить средство.','A refreshing rinse':'Освежающее умывание',
  'Move the mist across the bubbles to rinse.':'Проведи спреем по пузырькам, чтобы смыть их.','Soft & squeaky clean':'Мягко и до скрипа чисто',
  'Pat each glowing spot dry with your towel.':'Промокни полотенцем каждое светящееся место.',
  'Berry Happy':'Ягодное счастье','A sweet little skin treat':'Сладкое угощение для кожи','A berry lovely mask':'Чудесная ягодная маска',
  'Brush the pink mask onto all the bare skin.':'Нанеси розовую маску кистью на всю кожу.','Let the goodness sink in':'Пусть всё впитается',
  'Hold on each little flower to massage.':'Удерживай палец на каждом цветочке для массажа.','The satisfying part':'Самое приятное',
  'Pull each mask tab down to peel it away.':'Потяни каждый край маски вниз, чтобы снять её.','Seal in the glow':'Закрепи сияние',
  'Add a little serum to each sparkling spot.':'Нанеси немного сыворотки на каждую блестящую точку.',
  'Bright Eyes':'Сияющий взгляд','A tiny reset for tired eyes':'Отдых для уставших глаз','A fresh little start':'Свежее начало',
  'Gently wipe away the sleepy smudges.':'Аккуратно сотри сонные следы.','A drop of kindness':'Капля заботы',
  'Press each glowing spot to add eye serum.':'Нажми на каждую светящуюся точку, чтобы нанести сыворотку.','Patch perfect':'Патчи на месте',
  'Drag each eye patch onto its dotted outline.':'Перетащи каждый патч на пунктирный контур.','Cool, calm & collected':'Прохлада и спокойствие',
  'Hold on each patch. Breathe in, breathe out.':'Удерживай палец на каждом патче. Вдох, выдох.','Hello, bright eyes':'Привет, сияющий взгляд',
  'Pull both patches outward to lift them off.':'Потяни оба патча в стороны, чтобы снять их.',
  'Jade & Joy':'Нефрит и радость','Roll your worries away':'Пусть тревоги укатятся прочь','A dewy beginning':'Свежее, как роса, начало',
  'Hold the dropper over each glowing spot.':'Держи пипетку над каждой светящейся точкой.','A gentle lift':'Мягкий лифтинг',
  'Follow each arrow from the dot to the tip.':'Веди по каждой стрелке от точки до кончика.','Smooth little circles':'Плавные круги',
  'Massage each flower with a slow, steady hold.':'Массируй каждый цветок, медленно удерживая палец.','One last fresh breath':'Последний свежий вдох',
  'Sweep the cooling mist across your skin.':'Проведи охлаждающим спреем по коже.',
  'Soft Glow':'Нежное сияние','Your feel-good finishing touch':'Финальный штрих для настроения','Your perfect canvas':'Идеальная основа',
  'Blend the skin tint with soft sweeping strokes.':'Растушуй тон мягкими движениями.','A little rosy glow':'Лёгкий румянец',
  'Brush softly across both dotted cheek areas.':'Мягко проведи кистью по обеим отмеченным скулам.','A touch of shimmer':'Капля мерцания',
  'Sweep the brush over both eyelids.':'Проведи кистью по обоим векам.','The sweetest finishing touch':'Самый милый финальный штрих',
  'Glide the lip tint over the dotted lip shape.':'Нанеси тинт по пунктирному контуру губ.',

  // Hint captions
  'Hold the zipper. Follow the glowing edge.':'Держи молнию. Веди вдоль светящегося края.',
  'Press at the glow. Keep holding and follow the path.':'Нажми на свечение. Удерживай и веди по пути.',
  'Tap to rotate. Then drag into the matching space.':'Нажми, чтобы повернуть. Затем перетащи на нужное место.',
  'Hold the leaf. Drag it away.':'Зажми листок. Убери его в сторону.','Hold the item. Drag to the glow, then let go.':'Зажми предмет. Перетащи к свечению и отпусти.',
  'Hold the strand. Pull it across to the glow.':'Зажми прядь. Протяни её к свечению.','Hold the glowing edge. Fold it in this direction.':'Зажми светящийся край. Сложи в этом направлении.',
  'Keep holding. Move in smooth circles.':'Не отпускай. Веди плавными кругами.',
  'Wait for the sweet to reach the center. Then tap!':'Дождись, когда сладость окажется в центре. Тогда нажми!',
  'Tap the bath bomb to crack it open.':'Нажми на бомбочку, чтобы расколоть её.','Tap a bubble to pop it.':'Нажми на пузырь, чтобы лопнуть его.',
  'Hold the lit match at the wick.':'Держи зажжённую спичку у фитиля.','Hold here until it is completely filled.':'Удерживай, пока всё не заполнится.',
  'Press and hold here to add the fragrance.':'Нажми и удерживай, чтобы добавить аромат.','Hold here. Let go when the ring reaches mint.':'Удерживай. Отпусти, когда кольцо станет мятным.',
  'Hold and brush over the glowing area.':'Удерживай и води кистью по светящейся области.','Hold and rub little circles over the glow.':'Удерживай и три маленькими кругами по свечению.',
  'Hold and gently wipe across the glowing area.':'Удерживай и мягко протирай светящуюся область.','Hold and brush across the glowing area.':'Удерживай и проведи кистью по светящейся области.',
  'Hold the eye patch. Drag it to its outline.':'Зажми патч. Перетащи его на контур.','Hold the patch. Pull outwards to peel it off.':'Зажми патч. Потяни в сторону, чтобы снять.',
  'Grab the glowing tab. Keep holding and pull down.':'Возьми светящийся край. Удерживай и тяни вниз.',
  'Press at the glow. Roll slowly along the path.':'Нажми на свечение. Медленно веди роллер по пути.',
  'Press and keep holding until the ring is full.':'Нажми и удерживай, пока кольцо не заполнится.','Tap now! The sweet is in the center.':'Жми! Сладость в центре.',
  'Wait for the sweet to reach the center...':'Дождись, когда сладость окажется в центре...','Tap once to turn the item upright.':'Нажми один раз, чтобы повернуть предмет.',
  'Now hold, drag into the glow, and let go.':'Теперь зажми, перетащи к свечению и отпусти.','Let go now — the ring is mint!':'Отпускай — кольцо мятное!',
  'Let go here. Your turn!':'Отпусти здесь. Твоя очередь!','Your turn! Try the same movement.':'Твоя очередь! Повтори это движение.',

  // Dress-up levels
  'Garden Brunch':'Бранч в саду','A peach blossom afternoon':'День в цвету персика','A dress in bloom':'Платье в цвету',
  'The cozy little layer':'Уютный слой','Flowers for the finishing touch':'Цветы для финального штриха','City Chic':'Городской шик',
  'A stroll through the city':'Прогулка по городу','A little lilac style':'Немного сиреневого стиля','Ready for the city':'Готова к городу',
  'Your own signature style':'Твой фирменный стиль','Seaside Afternoon':'День у моря','Sunshine and sea breezes':'Солнце и морской бриз',
  'A drop of sunshine':'Капля солнца','Dress for the sea breeze':'Наряд для морского бриза','A little seaside charm':'Морское очарование',
  'Evening in Velvet':'Бархатный вечер','Your evening begins here':'Твой вечер начинается здесь','A lovely evening dress':'Прелестное вечернее платье',
  'Soft layers, lovely shoes':'Мягкие слои, милые туфли','The final pearl details':'Последние жемчужные детали',
  'Drag the dress onto her outfit outline.':'Перетащи платье на контур наряда.',
  'Place the jacket and shoes on their glowing outlines.':'Помести жакет и туфли на светящиеся контуры.',
  'Add her bag and hair clip to complete the look.':'Добавь сумочку и заколку, чтобы завершить образ.',

  // Premium levels
  'Clear the space':'Освободи пространство','Drag every piece of litter into the bin.':'Перетащи весь мусор в корзину.','Every last crumb':'До последней крошки',
  'Hold the vacuum and sweep its nozzle across the crumbs.':'Держи пылесос и проводи насадкой по крошкам.','Cover it in soft foam':'Покрой мягкой пеной',
  'Spray detergent over the entire dirty surface.':'Распыли средство по всей грязной поверхности.','Lift the deep stains':'Выведи глубокие пятна',
  'Brush back and forth. Clean tracks appear wherever you scrub.':'Три щёткой туда-обратно. Где трёшь — появляются чистые полосы.',
  'Extract the foam':'Убери пену','Sweep the extractor across all the foam to reveal the clean surface.':'Проведи экстрактором по всей пене, чтобы открыть чистую поверхность.',
  'A crystal-clear view':'Кристально чистый вид','Drag the rubber blade across the streaked glass.':'Проведи резиновым скребком по стеклу в разводах.',
  'Brush the pile smooth':'Расчеши ворс','Brush downward across the rug to restore its soft finish.':'Проведи щёткой вниз по ковру, чтобы вернуть ему мягкость.',
  'Ready for the next guest':'Готово к новому гостю','Drag each amenity into its matching place in the scene.':'Перетащи каждую мелочь на её место.',
  'A complete, hands-on restoration':'Полное восстановление своими руками','Choose, check out and pack your own haul':'Выбери, оплати и упакуй покупки',
  'Your personal shopping list':'Твой список покупок','Drag the requested products into your basket. Stay within budget.':'Перетащи нужные товары в корзину. Уложись в бюджет.',
  'At the checkout':'На кассе','Drag every selected item across the scanner, then into the bag.':'Проведи каждый товар через сканер, а затем положи в пакет.',
  'A perfectly packed haul':'Идеально упакованные покупки','Fit your purchases into the matching compartments.':'Разложи покупки по подходящим отделениям.',
  'A full appointment, from cleansing to evening makeup':'Полный сеанс: от очищения до вечернего макияжа',
  "Remove yesterday's makeup":'Сними вчерашний макияж','Wipe the whole face clean with the cotton pad.':'Протри всё лицо ватным диском.',
  'A proper double cleanse':'Настоящее двойное очищение','Work the cleanser over every part of the skin.':'Распредели очищающее средство по всей коже.',
  'Rinse away the foam':'Смой пену','Sweep the spray over every foamy area.':'Проведи спреем по всем местам с пеной.',
  'A cooling treatment mask':'Охлаждающая маска','Brush the treatment evenly over the face.':'Равномерно нанеси средство кистью на лицо.',
  'Peel and reveal':'Сними и любуйся','Take each tab and slowly peel the mask downward.':'Бери каждый край и медленно снимай маску вниз.',
  'Serum before makeup':'Сыворотка перед макияжем','Add serum to every glowing skincare point.':'Нанеси сыворотку на каждую светящуюся точку.',
  'A flawless base':'Безупречная основа','Blend the foundation across the whole face.':'Растушуй тональную основу по всему лицу.',
  'Sculpt the cheeks':'Подчеркни скулы','Blend blush gently onto both cheeks.':'Мягко растушуй румяна на обеих щеках.',
  'Evening eye color':'Вечерние тени','Sweep shimmer onto both eyelids.':'Нанеси мерцающие тени на оба века.',
  'The final lip color':'Финальный цвет губ','Fill the lip shape carefully for the finished look.':'Аккуратно закрась контур губ, чтобы завершить образ.',
  'The couture fitting':'Примерка от кутюр','Style the complete outfit':'Собери весь образ',
  'Slide right to reveal the finished outfit, then save your look.':'Сдвинь вправо, чтобы увидеть готовый наряд, и сохрани образ.',
  'Smooth every fold':'Разгладь каждую складку','Move the iron down each crease. Follow the fabric all the way to the hem.':'Веди утюг вниз по каждой складке до самого подола.',
  'A hand-finished hem':'Подол ручной работы','Guide the needle along each seam, from the glowing starting point.':'Веди иглу вдоль каждого шва от светящейся начальной точки.',
  'Cleanse, style, fit, press and hand-finish her outfit':'Очисти, уложи, примерь, отутюжь и дошей её наряд',
  'Private Jet Reset':'Уборка частного самолёта','Persian Rug Revival':'Возрождение персидского ковра','The Boutique Haul':'Покупки в бутике',
  'Couture Appointment':'Визит к кутюрье','Designer Sofa Rescue':'Спасение дизайнерского дивана','Red Carpet Makeup':'Макияж для красной дорожки',
  'Penthouse Spa Reset':'Спа-уборка пентхауса','Beauty Shopping Spree':'Бьюти-шопинг','Convertible Detail':'Детейлинг кабриолета',
  'Evening Atelier':'Вечернее ателье','Runway Skin & Glam':'Подиумный уход и глэм','Yacht Lounge Refresh':'Освежение салона яхты',

  // Premium rituals
  'PACK YOUR PURCHASES':'УПАКУЙ ПОКУПКИ','One item per category. Return one to the shelf to swap.':'По одному товару из категории. Верни товар на полку, чтобы заменить.',
  'Over budget. Return an expensive item and choose another.':'Бюджет превышен. Верни дорогой товар и выбери другой.',
  'Now put the scanned item in the bag.':'Теперь положи отсканированный товар в пакет.','Move the item across the glowing scanner first.':'Сначала проведи товар через светящийся сканер.',
  'Lovely!':'Чудесно!','Pick up and drag - release to place':'Возьми и перетащи — отпусти, чтобы положить',
  'YOUR BASKET - drag out to return':'ТВОЯ КОРЗИНА — вытащи, чтобы вернуть','SCAN HERE':'СКАНИРУЙ ЗДЕСЬ','SCANNED':'ГОТОВО',
  'Move the tool across this unfinished area.':'Проведи инструментом по этому участку.','Sweep the vacuum nozzle over these crumbs.':'Проведи насадкой пылесоса по этим крошкам.',
  'Return this item to the shelf, then choose a less expensive option.':'Верни этот товар на полку и выбери подешевле.',
  'Scan this item, then drop it in the bag.':'Отсканируй товар и положи в пакет.','Pick up this item and drag it into place.':'Возьми этот предмет и перетащи на место.',
  'Outfit':'Наряд','Shoes':'Обувь','Bag':'Сумка','Accessory':'Аксессуар','Lip color':'Помада','Eye palette':'Тени','Brush':'Кисть','Fragrance':'Аромат',

  // Puzzle levels
  'Draw a little kindness':'Нарисуй немного доброты','Five tiny surprises':'Пять маленьких сюрпризов','A lovely little memory':'Чудесное воспоминание',
  'Meadow Guardian':'Страж луга','Draw one shelter. Lift your finger and protect the kitten for 10 seconds.':'Нарисуй одно укрытие. Отпусти палец и защищай котёнка 10 секунд.',
  'Pondside Puppy':'Щенок у пруда','A tiny island, two hives. Rest your shelter on the stone.':'Крошечный остров, два улья. Опри укрытие на камень.',
  'Double Cuddle':'Двойные обнимашки','Protect BOTH puppies with one line. Bridge their two little islands.':'Защити ОБОИХ щенков одной линией. Соедини их островки.',
  'Moonlight Rescue':'Спасение при луне','Use the tall pillars to support a roof. Keep all three swarms out.':'Опри крышу на высокие столбы. Не пусти все три роя.',
  'Tea-Time Secrets':'Секреты чаепития','Compare the two pictures. Tap each of the 5 differences.':'Сравни две картинки. Нажми на каждое из 5 отличий.',
  'Garden Secrets':'Секреты сада','Look closely at both gardens. Find 5 little changes.':'Присмотрись к обоим садам. Найди 5 изменений.',
  'Vanity Secrets':'Секреты туалетного столика','Five details have changed. Tap them in either picture.':'Пять деталей изменились. Нажми на них на любой картинке.',
  'Cozy Pet Secrets':'Секреты уютных питомцев','Compare the cozy rooms. Find all 5 differences.':'Сравни уютные комнаты. Найди все 5 отличий.',
  'Pocket Pals':'Карманные друзья','Turn over two cards. Remember the pets and match all 6 pairs.':'Переверни две карточки. Запомни питомцев и собери все 6 пар.',
  'Garden Memories':'Садовые воспоминания','Match all 6 garden pairs. Take a peek, then trust your memory.':'Собери все 6 садовых пар. Подсмотри и доверься памяти.',
  'Sweet Memories':'Сладкие воспоминания','Find the 6 matching treats. Every pair is a little celebration.':'Найди 6 пар сладостей. Каждая пара — маленький праздник.',
  'Beauty Match':'Бьюти-пары','A bigger beauty box! Remember and match all 8 pairs.':'Бьюти-коробка побольше! Запомни и собери все 8 пар.',
  'ONE LINE · LIMITED INK':'ОДНА ЛИНИЯ · МАЛО ЧЕРНИЛ','KEEP YOUR LITTLE FRIENDS SAFE!':'ЗАЩИТИ МАЛЫШЕЙ!',
  'A bee slipped through. Try another line.':'Пчела проскользнула. Попробуй другую линию.','SAFE & SNUG!':'В БЕЗОПАСНОСТИ!','Already spotted!':'Уже найдено!',
  'Draw this shelter in one stroke. Lift your finger to start.':'Нарисуй укрытие одним движением. Отпусти палец, чтобы начать.',
  'Compare this little detail. Tap the difference here.':'Сравни эту деталь. Нажми на отличие здесь.','Tap these matching cards, one after the other.':'Нажми на эти парные карточки по очереди.',

  // Romance levels
  'Rosie':'Рози','Chloe':'Хлоя','Amara':'Амара','Mei':'Мэй','Lucia':'Люсия','Freya':'Фрейя','Sienna':'Сиенна','Luna':'Луна','Isla':'Айла','Zara':'Зара',
  'Rose Garden Romance':'Роман в розовом саду','Pearl Coast Promise':'Обещание на Жемчужном берегу','Violet Evening':'Фиалковый вечер',
  'Cherry Blossom Vows':'Клятвы под цветущей вишней','Sunflower Sweetheart':'Подсолнечная любовь','Snowflake Fairytale':'Снежная сказка',
  'Autumn in Love':'Влюблённая осень','Moonlit Ballroom':'Лунный бал','Coral Island Kiss':'Поцелуй на Коралловом острове','Emerald Royal Wedding':'Изумрудная королевская свадьба',
  'A warm welcome':'Тёплый приём','Wash each muddy patch. Gentle circles make soft bubbles.':'Отмой каждое грязное пятно. Мягкие круги дают нежную пену.',
  'A lovely new hairstyle':'Новая чудесная причёска','Hold and brush down each glowing strand. Keep holding between strands.':'Удерживай и расчёсывай вниз каждую светящуюся прядь. Не отпускай между прядями.',
  'Her dream dress':'Платье её мечты','Drag the dress onto her, then pull the golden zipper upward.':'Перетащи на неё платье, затем потяни золотую молнию вверх.',
  'A little sparkle':'Немного блеска','Place the necklace and hair jewel on their glowing outlines.':'Помести ожерелье и украшение для волос на светящиеся контуры.',
  'Look how far she has come':'Посмотри, как она изменилась','Slide the handle all the way right to reveal her new look.':'Сдвинь ползунок до упора вправо, чтобы увидеть её новый образ.',
  'A question from the heart':'Вопрос от всего сердца','Drag the diamond ring into the glowing heart.':'Перетащи кольцо с бриллиантом в светящееся сердце.',
  'Their happily ever after':'И жили они долго и счастливо','Enjoy the wedding. Tap the hearts, then keep this moment.':'Наслаждайся свадьбой. Нажимай на сердечки и сохрани этот момент.',
  'AFTER':'ПОСЛЕ','BEFORE':'ДО','KEEP THIS LOOK':'СОХРАНИТЬ ОБРАЗ','HER NEXT CHAPTER':'НОВАЯ ГЛАВА','Will you marry me?':'Ты выйдешь за меня?',
  'Happily ever after':'Долго и счастливо','KEEP THIS MOMENT':'СОХРАНИТЬ МОМЕНТ','A beautiful new chapter':'Прекрасная новая глава',
  'Slide right to reveal her new look':'Сдвинь вправо, чтобы увидеть её новый образ','A perfect fit!':'Сидит идеально!','YES!':'ДА!',
  'Pull the zipper up':'Потяни молнию вверх','Drag her dress to the glowing outline':'Перетащи платье на светящийся контур',
  'Hold and wash this glowing patch in gentle circles.':'Удерживай и отмывай это пятно мягкими кругами.','Hold the zipper. Pull it all the way up.':'Зажми молнию. Тяни до самого верха.',
  'Follow the line from the glowing starting point.':'Веди по линии от светящейся начальной точки.',
  'Keep holding and brush down the glow. Move to the next strand without lifting.':'Удерживай и расчёсывай вниз по свечению. Переходи к следующей пряди, не отрывая палец.',
  'Hold the ring. Drag it into the glowing heart.':'Зажми кольцо. Перетащи его в светящееся сердце.','Hold the accessory. Drag it onto its glowing outline.':'Зажми украшение. Перетащи его на светящийся контур.',
  'Tap to save the finished look.':'Нажми, чтобы сохранить готовый образ.','Tap to turn the page and meet her sweetheart.':'Нажми, чтобы перевернуть страницу и встретить её любимого.',
  'Slide the handle right to reveal her new look.':'Сдвинь ползунок вправо, чтобы увидеть её новый образ.','Tap to keep this wedding memory.':'Нажми, чтобы сохранить свадебное воспоминание.',
  'A lovely wedding moment. The button opens in a moment.':'Чудесный свадебный момент. Кнопка скоро появится.',

  // Workshop levels
  'Silk & Braids':'Шёлк и косы','A little salon magic':'Немного салонной магии','Silky from root to tip':'Шёлк от корней до кончиков',
  'Drag the comb down each glowing strand.':'Проведи расчёской вниз по каждой светящейся пряди.','A fresh little trim':'Свежая стрижка',
  'Slide the scissors along the dotted ends.':'Проведи ножницами по пунктирным кончикам.','Over, under, lovely':'Сверху, снизу, красиво',
  'Hold and follow the glowing arrows. Keep moving without letting go.':'Удерживай и веди по светящимся стрелкам. Не отпускай палец.',
  'Outfit Atelier':'Ателье нарядов','Your own little runway':'Твой маленький подиум','Pretty in pink':'Красотка в розовом','Layer the lovely':'Красивые слои',
  'Add the jacket, then slip on the golden shoes.':'Добавь жакет, затем надень золотые туфли.','The finishing touches':'Последние штрихи',
  'Place the bag and butterfly where they belong.':'Помести сумочку и бабочку на свои места.','Laundry Love':'Любовь к стирке','From messy to cozy':'Из беспорядка в уют',
  'Goodbye, little stains':'Прощайте, пятнышки','Rub each mark until the knit is clean.':'Три каждое пятно, пока вязка не станет чистой.','Steam it smooth':'Разгладь паром',
  'Glide the iron along every crease.':'Проведи утюгом по каждой складке.','Fold into a hug':'Сложи, как объятие',
  'Fold left, right, then bring the hem upward.':'Сложи влево, вправо, затем подними низ вверх.','Evening Glam':'Вечерний глэм','A full rosy makeover':'Полное розовое преображение',
  'Blend your perfect rose':'Смешай идеальный розовый','Swirl clockwise to mix the two shades.':'Веди по часовой стрелке, чтобы смешать два оттенка.',
  'Blush, eyes, glossy lips':'Румяна, глаза, блеск для губ','Brush each glowing makeup area gently.':'Мягко проведи кистью по каждой светящейся зоне.',
  'A little winged magic':'Немного магии стрелок','Follow the lashes outward, then add highlights.':'Веди по ресницам наружу, затем добавь блики.',
  'Purr-fect Spa':'Мур-спа','A very fluffy little guest':'Очень пушистый гость','A tiny garden explorer':'Маленький садовый исследователь',
  'Lift the leaves off the kitten into the basket.':'Убери листья с котёнка в корзинку.','Fluffy bubble bath':'Пушистая пенная ванна',
  'Rub the muddy patches into sparkling foam.':'Взбей грязные пятна в блестящую пену.','Soft as a cloud':'Мягкий, как облачко',
  'Brush down the fur, one soft stroke at a time.':'Расчеши шёрстку вниз, мягко, движение за движением.','Vanity Tidy':'Порядок на столике',
  'Everything in its happy place':'Всё на своих местах','Little lipstick lineup':'Ряд помад','Match the lipsticks and mascara to their slots.':'Расставь помады и тушь по ячейкам.',
  'A place for every palette':'Место для каждой палетки','Fit the compacts and palettes into the box.':'Уложи пудреницы и палетки в коробку.',
  'The perfect final row':'Идеальный последний ряд','Tuck in the brushes and perfume bottles.':'Уложи кисти и флаконы духов.','Pearl Tips':'Жемчужный маникюр',
  'Five tiny works of art':'Пять крошечных шедевров','Shape those little tips':'Придай форму ноготкам','File along the glowing nail edges.':'Подпили светящиеся края ногтей.',
  'A coat of candy pink':'Слой конфетно-розового','Hold the brush over each nail to paint it.':'Держи кисточку над каждым ногтем, чтобы покрасить его.',
  'Pearls, please':'Жемчуг, пожалуйста','Place a tiny pearl on each painted nail.':'Помести жемчужинку на каждый окрашенный ноготь.','Sneaker Bloom':'Цветущие кеды',
  'A fresh start for your favorites':'Новая жизнь любимой пары','Fresh from heel to toe':'Свежие от пятки до носка','Scrub away the scuffs on the shoe.':'Ототри потёртости с обуви.',
  'Lace a little zigzag':'Зашнуруй зигзагом','Follow the glowing dot through the eyelets.':'Веди за светящейся точкой через люверсы.','Loop, cross, pull':'Петля, крест, затянуть',
  'Trace the two loops to tie a perfect bow.':'Обведи две петли, чтобы завязать идеальный бант.','Pearl Story':'Жемчужная история','Thread a little treasure':'Нанижи сокровище',
  'Make the pearls glow':'Заставь жемчуг сиять','Polish each pearl with soft little circles.':'Отполируй каждую жемчужину мягкими кругами.',
  'One lovely bead at a time':'Бусина за бусиной','Thread pearls and hearts in the shown order.':'Нанизывай жемчуг и сердечки в показанном порядке.',
  'Close with a kiss':'Застегни с поцелуем','Drag both clasp ends together at the top.':'Соедини оба конца застёжки наверху.','Blossom Wrap':'Цветочная упаковка',
  'Flowers just for you':'Цветы только для тебя','A fresh cut':'Свежий срез','Trim the stems along the glowing line.':'Подрежь стебли по светящейся линии.',
  'Petal by petal':'Лепесток за лепестком','Lift away the faded petals and make room to bloom.':'Убери увядшие лепестки, освободи место для цветения.',
  'Wrap up something lovely':'Упакуй что-то чудесное','Fold the paper inward, then tie the ribbon.':'Загни бумагу внутрь, затем завяжи ленту.',
  'Sweet Little Stack':'Сладкая башенка','A pastel patisserie moment':'Пастельная кондитерская','Pipe a perfect cloud':'Отсади идеальное облачко',
  'Hold each shell. Let go when STOP! appears.':'Удерживай над каждой половинкой. Отпусти, когда появится «СТОП!».','A delicate little sandwich':'Нежный маленький сэндвич',
  'Match every mint lid to a filled pink shell.':'Накрой каждую розовую половинку мятной крышечкой.','Balance the sweetness':'Баланс сладости',
  'Drop each macaron when it lines up with the stack.':'Отпускай макарон, когда он над башенкой.','Candle Cuddle':'Уютная свеча','Pour a pocket of calm':'Налей немного спокойствия',
  'A drop of lavender':'Капля лаванды','Bring the fragrance over the jar and hold to pour.':'Поднеси аромат к банке и удерживай, чтобы налить.','Fill it with calm':'Наполни спокойствием',
  'Hold to fill the candle completely. You can pause and continue.':'Удерживай, чтобы заполнить свечу. Можно прерваться и продолжить.',
  'Trim the little wick':'Подрежь фитилёк','Slide the scissors along the wick.':'Проведи ножницами вдоль фитиля.','A little light of your own':'Твой собственный огонёк',
  'Hold the lit match against the wick to light your candle.':'Поднеси зажжённую спичку к фитилю, чтобы зажечь свечу.','Cozy Stitch':'Уютный стежок',
  'Make a heart with every stitch':'Сердечко в каждом стежке','Thread your first heart':'Вышей первое сердечко',
  'Follow the glowing dot to sew a little heart.':'Веди за светящейся точкой, чтобы вышить сердечко.','Over and under':'Сверху и снизу',
  'Sew the little diagonal stitches in order.':'Прошей маленькие диагональные стежки по порядку.','A tiny golden signature':'Крошечная золотая подпись',
  'Sew the leaves, then finish with a pearl.':'Вышей листья, а в конце добавь жемчужину.','Lavender Fizz':'Лавандовые пузырьки','A swirly little escape':'Кружащийся отдых',
  'Crack a little cloud':'Расколи облачко','Tap the bath bomb to crumble it into the water.':'Нажми на бомбочку, чтобы раскрошить её в воду.',
  'Make a lavender whirlpool':'Создай лавандовый водоворот','Draw circles through the water to blend the fizz.':'Рисуй круги по воде, чтобы размешать пену.',
  'One last lovely pop':'Последний чудесный «чпок»','Pop the pearly bubbles floating in the bath.':'Лопни жемчужные пузырьки в ванне.','Pack & Go':'Собирай и в путь',
  'Everything fits, beautifully':'Всё помещается идеально','The perfect fit':'Идеально подходит','Tap an item to rotate. Drag it into its outline.':'Нажми на предмет, чтобы повернуть. Перетащи его на контур.',
  'Room for a little color':'Место для цвета','Rotate the palettes and fit them beside the bottles.':'Поверни палетки и уложи их рядом с флаконами.',
  'Ready for a little escape':'Готово к маленькому путешествию','Fit the last essentials, then pull the zipper closed.':'Уложи последние вещи и застегни молнию.',
  'A little closer to the center':'Чуть ближе к центру','Pull the glowing zipper around the edge':'Тяни светящуюся молнию вдоль края',
  'Tap to rotate, then match the outline':'Нажми, чтобы повернуть, затем совмести с контуром','Release when the ring turns mint':'Отпусти, когда кольцо станет мятным',
  'STOP!':'СТОП!','Pull the zipper closed':'Застегни молнию','Hold the match at the wick':'Держи спичку у фитиля','RELEASE NOW':'ОТПУСКАЙ',
  'Hold, then release in the mint zone':'Удерживай и отпусти в мятной зоне',
}));

const name=s=>RU.get(s)??s;
// Compact buttons have room for a shorter label only.
const SHORT_RU=new Map([['SPA PASS','ПРОПУСК']]);
export const shortLabel=label=>lang==='ru'&&SHORT_RU.get(label)||label;
const quoted=s=>`«${name(s)}»`;
const known=s=>RU.has(s)||undefined;
// Dynamic strings: [English pattern, Russian builder].
const PATTERNS=[
  [/^Loading… (\d+)%$/,(_,n)=>`Загрузка… ${n}%`],
  [/^Loading all levels… (\d+)%$/,(_,n)=>`Загрузка всех уровней… ${n}%`],
  [/^(\d+) \/ (\d+) treasured moments$/,(_,a,b)=>`${a} / ${b} памятных моментов`],
  [/^(\d+)–(\d+) of (\d+) {2}· {2}Swipe to explore$/,(_,a,b,c)=>`${a}–${b} из ${c}  ·  Листай, чтобы смотреть`],
  [/^\+(\d+) coins$/,(_,n)=>`+${coins(n)}`],
  [/^(\d+) coins$/,(_,n)=>coins(n)],
  [/^GET (\d+) COINS$/,(_,n)=>`ПОЛУЧИТЬ ${COINS(n)}`],
  [/^USE (\d+) COINS$/,(_,n)=>`ЗА ${COINS(n)}`],
  [/^(\d+) gift box(?:es)?$/,(_,n)=>`${n} ${plural(n,'подарок','подарка','подарков')}`],
  [/^(\d+) hints?$/,(_,n)=>`${n} ${plural(n,'подсказка','подсказки','подсказок')}`],
  [/^(\d+) stage skips?$/,(_,n)=>`${n} ${plural(n,'пропуск','пропуска','пропусков')} этапа`],
  [/^(\d+) skips?$/,(_,n)=>`${n} ${plural(n,'пропуск','пропуска','пропусков')}`],
  [/^(.+) card$/,(_,s)=>known(s)&&`Карта ${quoted(s)}`],
  [/^Ready in (.+) of play$/,(_,s)=>`Готово через ${s} игры`],
  [/^Treasure (\d+)%$/,(_,n)=>`Сокровище ${n}%`],
  [/^Complete (.+)$/,(_,s)=>known(s)&&`Пройди ${quoted(s)}`],
  [/^Day (\d+) gift!$/,(_,n)=>`Подарок дня ${n}!`],
  [/^Day (\d+)$/,(_,n)=>`День ${n}`],
  [/^Reward (\d+)$/,(_,n)=>`Награда ${n}`],
  [/^Ritual (\d+)$/,(_,n)=>`Ритуал ${n}`],
  [/^LV (\d+)$/,(_,n)=>`УР ${n}`],
  [/^Spa Pass (\d+)\/7 reward included$/,(_,n)=>`Включена награда Спа-пропуска ${n}/7`],
  [/^Spa Pass (\d+)\/7 bonus included$/,(_,n)=>`Включён бонус Спа-пропуска ${n}/7`],
  [/^Spa Pass (\d+)\/7: (.+)$/,(_,n,s)=>`Спа-пропуск ${n}/7: ${t(s)}`],
  [/^(\d+) coins added to your purse\.$/,(_,n)=>`${coins(n)} в твоём кошельке.`],
  [/^(\d+) coins spent\.$/,(_,n)=>`Потрачено: ${coins(n)}.`],
  [/^(\d+) \/ 7 rewarded videos completed$/,(_,n)=>`Просмотрено видео: ${n} / 7`],
  [/^Level (\d+) is now permanently unlocked\.$/,(_,n)=>`Уровень ${n} открыт навсегда.`],
  [/^(.+) is yours to play\.$/,(_,s)=>known(s)&&`${quoted(s)} теперь твой.`],
  [/^(\d+) \+ (\d+) = (\d+) level coins$/,(_,a,b,c)=>`${a} + ${b} = ${coins(c)} за уровень`],
  [/^(\d+) bubble coins \+ (\d+) completion coins!$/,(_,a,b)=>`${coins(a)} за пузыри + ${b} за завершение!`],
  [/^(\d+) coins for a lovely little break\.$/,(_,n)=>`${coins(n)} за чудесный перерыв.`],
  [/^(\d+) ready to open$/,(_,n)=>`Готово к открытию: ${n}`],
  [/^(\d+) coins \+ (\d+) gift boxes$/,(_,a,b)=>`${coins(a)} + ${b} ${plural(b,'подарок','подарка','подарков')}`],
  [/^(\d+)\/7 collected · Grand prize at 7$/,(_,n)=>`Собрано ${n}/7 · Главный приз за 7`],
  [/^(\d+) unopened gifts?$/,(_,n)=>`Неоткрытых подарков: ${n}`],
  [/^60%: (\d+) coins · 25%: 2 hints · 15%: Lucky card$/,(_,n)=>`60%: ${coins(n)} · 25%: 2 подсказки · 15%: талисман`],
  [/^Duplicate collectibles become (\d+) coins\.$/,(_,n)=>`Повторные награды превращаются в ${coins(n)}.`],
  [/^(.*[A-Z]{2}.*) \/ (\d+)$/,(_,s,n)=>`${name(s)} / ${n}`],
  [/^UNLOCK · (\d+)$/,(_,n)=>`ОТКРЫТЬ · ${n}`],
  [/^You need (\d+) more coins$/,(_,n)=>`Не хватает ${n} ${plural(n,'монеты','монет','монет')}`],
  [/^You have (\d+) hints$/,(_,n)=>`У тебя подсказок: ${n}`],
  [/^You have (\d+) stage skips$/,(_,n)=>`У тебя пропусков этапа: ${n}`],
  [/^(\d+) free coin rounds left today$/,(_,n)=>`Раундов с монетами сегодня: ${n}`],
  [/^(\d+) free coin rounds left today - Shared by both games$/,(_,n)=>`Раундов с монетами сегодня: ${n} — общие для обеих игр`],
  [/^Video: 1-10 coins per pop \+ (\d+) at the end$/,(_,n)=>`Видео: 1–10 монет за пузырь + ${n} в конце`],
  [/^Video: (\d+) coins on completion$/,(_,n)=>`Видео: ${coins(n)} за прохождение`],
  [/^Video round: 1-10 per pop \+ (\d+) at the end$/,(_,n)=>`Раунд за видео: 1–10 за пузырь + ${n} в конце`],
  [/^Video round: (\d+) coins on completion$/,(_,n)=>`Раунд за видео: ${coins(n)} за прохождение`],
  [/^1-10 coins per pop \+ (\d+) on completion$/,(_,n)=>`1–10 монет за пузырь + ${n} за прохождение`],
  [/^(\d+) coins on completion$/,(_,n)=>`${coins(n)} за прохождение`],
  [/^(\d+) \/ 18 little pops$/,(_,n)=>`${n} / 18 пузырьков`],
  [/^(\d+) \/ 5 balanced stones$/,(_,n)=>`${n} / 5 камней в равновесии`],
  [/^Next gift in ([\d:]+)$/,(_,s)=>`Следующий подарок через ${s}`],
  [/^YOUR HAUL {2}\$(\d+)$/,(_,n)=>`ТВОИ ПОКУПКИ  $${n}`],
  [/^(\d+)% (covered|smoothed|clean) - keep moving the tool$/,(_,n,w)=>`${n}% ${{covered:'покрыто',smoothed:'выровнено',clean:'чисто'}[w]} — продолжай водить инструментом`],
  [/^BUDGET \$(\d+) {3}\| {3}BASKET \$(\d+)$/,(_,a,b)=>`БЮДЖЕТ $${a}  |  КОРЗИНА $${b}`],
  [/^(\[[x ]\] .*)$/,(_,s)=>s.replace(/(\[[x ]\] )([^[]+?)(?= {3}\[|$)/g,(_,box,item)=>box+name(item))],
  [/^([\d.]+)s TO SAFETY$/,(_,n)=>`ЕЩЁ ${n} С`],
  [/^INK (\d+)%$/,(_,n)=>`ЧЕРНИЛА ${n}%`],
  [/^(\d+) \/ 5 DIFFERENCES$/,(_,n)=>`${n} / 5 ОТЛИЧИЙ`],
  [/^(\d+) \/ (\d+) PAIRS$/,(_,a,b)=>`${a} / ${b} ПАР`],
  [/^(\d+) turns$/,(_,n)=>`Ходов: ${n}`],
  [/^(\d+)s$/,(_,n)=>`${n} с`],
  [/^(.+)'s new chapter$/,(_,s)=>`Новая глава: ${name(s)}`],
  [/^(\d+) \/ 5 fresh little spots$/,(_,n)=>`${n} / 5 чистых пятнышек`],
  [/^(\d+) \/ (\d+) creases smoothed$/,(_,a,b)=>`${a} / ${b} складок разглажено`],
  [/^(\d+) \/ (\d+) seams finished$/,(_,a,b)=>`${a} / ${b} швов готово`],
  [/^(\d+) \/ 3 silky strands$/,(_,n)=>`${n} / 3 шелковистых пряди`],
  [/^(\d+) \/ 2 finishing touches$/,(_,n)=>`${n} / 2 последних штриха`],
  [/^(\d+) \/ (\d+) {2}(peeled|placed|little moments)$/,(_,a,b,w)=>`${a} / ${b}  ${{peeled:'снято',placed:'на месте','little moments':'моментов'}[w]}`],
  [/^(\d+) \/ 6 {2}soothing strokes · follow the mint dot$/,(_,n)=>`${n} / 6  мягких движений · следуй за мятной точкой`],
  [/^(\d+) \/ 4 sweet layers$/,(_,n)=>`${n} / 4 сладких слоя`],
  [/^(\d+) \/ 8 little cracks$/,(_,n)=>`${n} / 8 трещинок`],
  [/^(\d+) \/ 4 soothing circles$/,(_,n)=>`${n} / 4 спокойных круга`],
  [/^(\d+) \/ (\d+) perfectly placed$/,(_,a,b)=>`${a} / ${b} на своих местах`],
  [/^(\d+) \/ (\d+) lovely strokes$/,(_,a,b)=>`${a} / ${b} красивых движений`],
  [/^(\d+)% filled$/,(_,n)=>`Заполнено ${n}%`],
  [/^(\d+) \/ (\d+) stars$/,(_,a,b)=>`${a} / ${b} звёзд`],
  [/^Level (\d+): (.+), buy for (\d+) coins$/,(_,n,s,p)=>`Уровень ${n}: ${name(s)}, купить за ${coins(p)}`],
  [/^Level (\d+): (.+)$/,(_,n,s)=>`Уровень ${n}: ${name(s)}`],
];

const direct=s=>{
  if(RU.has(s))return RU.get(s);
  for(const [pattern,build] of PATTERNS){const m=s.match(pattern);if(!m)continue;const found=build(...m);if(found!==undefined)return found;}
  return undefined;
};
// Composite labels ("Name. Collected", multi-line rewards) translate piece by piece.
const piece=s=>{
  const lead=s.match(/^\s*/)[0],body=s.trim();if(!body)return s;
  const found=direct(body)??direct(`${body}.`)?.replace(/\.$/,'');
  return found===undefined?s:lead+found;
};
const cache=new Map();
export function t(text){
  if(lang!=='ru'||typeof text!=='string'||!/[A-Za-z]/.test(text))return text;
  if(cache.has(text))return cache.get(text);
  let result=direct(text);
  if(result===undefined)result=text.split(/(\n|\. )/).map(part=>part==='\n'||part==='. '?part:piece(part)).join('');
  if(import.meta.env.DEV&&/[A-Za-z]{2}/.test(result))(globalThis.__i18nMisses??=new Set()).add(text);
  if(cache.size>2000)cache.clear();
  cache.set(text,result);return result;
}
// Every canvas label goes through Phaser's Text#setText, including the
// constructor, so translating there covers all scenes and later updates.
export function installTextTranslation(Phaser){
  const proto=Phaser.GameObjects.Text.prototype,setText=proto.setText;
  proto.setText=function(value){return setText.call(this,typeof value==='string'?t(value):value);};
}
