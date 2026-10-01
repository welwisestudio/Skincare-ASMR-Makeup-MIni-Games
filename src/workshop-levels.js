import { DRESSUP_LEVELS } from './dressup-levels.js';
import { PREMIUM_LEVELS } from './premium-levels.js';
import { PUZZLE_LEVELS } from './puzzle-levels.js';
import { ROMANCE_LEVELS } from './romance-levels.js';
// All coordinates live on a 600 × 600 worktable; the scene fits it between HUD and instructions.
const stage=(name,hint,mechanic,tool,extra={})=>({name,hint,mode:'workshop',mechanic,tool,seconds:12,...extra});
const level=(id,name,subtitle,steps)=>({id,name,subtitle,kind:'workshop',character:'cat',hero:`world-${id}`,color:0xdba7ca,steps});
export const WORKSHOP_LEVELS=[
 level('hair','Silk & Braids','A little salon magic',[
  stage('Silky from root to tip','Drag the comb down each glowing strand.','comb','world-comb'),
  stage('A fresh little trim','Slide the scissors along the dotted ends.','trim','world-scissors'),
  stage('Over, under, lovely','Hold and follow the glowing arrows. Keep moving without letting go.','braid','world-comb')]),
 level('dress','Outfit Atelier','Your own little runway',[
  stage('Pretty in pink','Drag the dress onto her outfit outline.','dress','world-party-dress'),
  stage('Layer the lovely','Add the jacket, then slip on the golden shoes.','layers','world-jacket'),
  stage('The finishing touches','Place the bag and butterfly where they belong.','accessorize','world-hairpin')]),
 level('laundry','Laundry Love','From messy to cozy',[
  stage('Goodbye, little stains','Rub each mark until the knit is clean.','laundry-wash','cotton'),
  stage('Steam it smooth','Glide the iron along every crease.','iron','world-iron'),
  stage('Fold into a hug','Fold left, right, then bring the hem upward.','fold','world-ribbon')]),
 level('glam','Evening Glam','A full rosy makeover',[
  stage('Blend your perfect rose','Swirl clockwise to mix the two shades.','mix','world-palette'),
  stage('Blush, eyes, glossy lips','Brush each glowing makeup area gently.','makeup','world-brush'),
  stage('A little winged magic','Follow the lashes outward, then add highlights.','liner','world-mascara')]),
 level('kitten','Purr-fect Spa','A very fluffy little guest',[
  stage('A tiny garden explorer','Lift the leaves off the kitten into the basket.','leaves','world-pet-brush'),
  stage('Fluffy bubble bath','Rub the muddy patches into sparkling foam.','kitten-wash','cleanser'),
  stage('Soft as a cloud','Brush down the fur, one soft stroke at a time.','groom','world-pet-brush')]),
 level('organizer','Vanity Tidy','Everything in its happy place',[
  stage('Little lipstick lineup','Match the lipsticks and mascara to their slots.','sort-tall','world-lipstick'),
  stage('A place for every palette','Fit the compacts and palettes into the box.','sort-flat','world-palette'),
  stage('The perfect final row','Tuck in the brushes and perfume bottles.','sort-last','world-brush')]),
 level('nails','Pearl Tips','Five tiny works of art',[
  stage('Shape those little tips','File along the glowing nail edges.','file','world-scissors'),
  stage('A coat of candy pink','Hold the brush over each nail to paint it.','polish','world-brush'),
  stage('Pearls, please','Place a tiny pearl on each painted nail.','nail-gems','world-pearl')]),
 level('sneaker','Sneaker Bloom','A fresh start for your favorites',[
  stage('Fresh from heel to toe','Scrub away the scuffs on the shoe.','shoe-wash','cotton'),
  stage('Lace a little zigzag','Follow the glowing dot through the eyelets.','lace','world-ribbon'),
  stage('Loop, cross, pull','Trace the two loops to tie a perfect bow.','tie','world-ribbon')]),
 level('jewels','Pearl Story','Thread a little treasure',[
  stage('Make the pearls glow','Polish each pearl with soft little circles.','pearl-polish','cotton'),
  stage('One lovely bead at a time','Thread pearls and hearts in the shown order.','beads','world-pearl'),
  stage('Close with a kiss','Drag both clasp ends together at the top.','clasp','world-gem')]),
 level('bouquet','Blossom Wrap','Flowers just for you',[
  stage('A fresh cut','Trim the stems along the glowing line.','stems','world-scissors'),
  stage('Petal by petal','Lift away the faded petals and make room to bloom.','petals','world-hairpin'),
  stage('Wrap up something lovely','Fold the paper inward, then tie the ribbon.','wrap','world-ribbon')]),
 level('macaron','Sweet Little Stack','A pastel patisserie moment',[
  stage('Pipe a perfect cloud','Hold each shell. Let go when STOP! appears.','filling','world-jug'),
  stage('A delicate little sandwich','Match every mint lid to a filled pink shell.','sandwich','world-macaron-top'),
  stage('Balance the sweetness','Drop each macaron when it lines up with the stack.','stack','world-shell')]),
 level('candle','Candle Cuddle','Pour a pocket of calm',[
  stage('A drop of lavender','Bring the fragrance over the jar and hold to pour.','fragrance','world-perfume'),
  stage('Fill it with calm','Hold to fill the candle completely. You can pause and continue.','wax','world-jug'),
  stage('Trim the little wick','Slide the scissors along the wick.','wick','world-scissors'),
  stage('A little light of your own','Hold the lit match against the wick to light your candle.','ignite','workshop-match')]),
 level('stitch','Cozy Stitch','Make a heart with every stitch',[
  stage('Thread your first heart','Follow the glowing dot to sew a little heart.','outline','world-needle'),
  stage('Over and under','Sew the little diagonal stitches in order.','cross-stitch','world-needle'),
  stage('A tiny golden signature','Sew the leaves, then finish with a pearl.','embellish','world-pearl')]),
 level('bath','Lavender Fizz','A swirly little escape',[
  stage('Crack a little cloud','Tap the bath bomb to crumble it into the water.','crush','world-bath-bomb'),
  stage('Make a lavender whirlpool','Draw circles through the water to blend the fizz.','swirl','world-pet-brush'),
  stage('One last lovely pop','Pop the pearly bubbles floating in the bath.','bath-pop','world-bath-bomb')]),
 level('pouch','Pack & Go','Everything fits, beautifully',[
  stage('The perfect fit','Tap an item to rotate. Drag it into its outline.','pack-tall','world-mascara'),
  stage('Room for a little color','Rotate the palettes and fit them beside the bottles.','pack-flat','world-palette'),
  stage('Ready for a little escape','Fit the last essentials, then pull the zipper closed.','pack-close','world-sachet')]),
];
export const CAMPAIGN_CARD_IDS=['fresh','berry','eyes','jade','glow',...WORKSHOP_LEVELS.map(l=>l.id),...PUZZLE_LEVELS.map(l=>l.id),...ROMANCE_LEVELS.map(l=>l.id),...PREMIUM_LEVELS.map(l=>l.id),...DRESSUP_LEVELS.map(l=>l.id)];
