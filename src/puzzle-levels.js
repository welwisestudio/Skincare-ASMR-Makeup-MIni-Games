const step=(name,hint,tool)=>({name,hint,mode:'puzzle',tool,seconds:60});
const level=(id,name,kind,theme,hero,hint,config={})=>({id,name,subtitle:kind==='rescue'?'Draw a little kindness':kind==='difference'?'Five tiny surprises':'A lovely little memory',kind:'puzzle',puzzle:kind,theme,hero,character:'cat',steps:[step(name,hint,kind==='rescue'?'puzzle-pencil':'hint')],...config});
export const RESCUES=[
 {ink:640,bg:'meadow',pets:[{x:300,y:423,art:'cat'}],hives:[{x:92,y:116}],platforms:[{x:300,y:495,w:600,h:60,art:'grass'}],solution:[[217,458],[212,354],[388,354],[383,458]]},
 {ink:630,bg:'pond',pets:[{x:300,y:377,art:'dog'}],hives:[{x:82,y:140},{x:518,y:155}],platforms:[{x:300,y:440,w:190,h:50,art:'stone'}],solution:[[219,408],[210,295],[390,295],[381,408]]},
 {ink:790,bg:'orchard',pets:[{x:210,y:389,art:'dog'},{x:390,y:389,art:'dog'}],hives:[{x:70,y:125},{x:530,y:125}],platforms:[{x:210,y:455,w:140,h:60,art:'grass'},{x:390,y:455,w:140,h:60,art:'grass'}],solution:[[165,418],[156,295],[444,295],[435,418]]},
 {ink:500,bg:'moon',pets:[{x:300,y:434,art:'cat'}],hives:[{x:82,y:163},{x:300,y:98},{x:518,y:163}],platforms:[{x:300,y:523,w:600,h:60,art:'stone'},{x:180,y:420,w:44,h:180,art:'stone'},{x:420,y:420,w:44,h:180,art:'stone'},{x:300,y:493,w:122,h:42,art:'mushroom'}],solution:[[179,323],[240,297],[360,297],[421,323]]},
];
export const MEMO_SETS={
 pets:['cat','dog','bunny','hamster','turtle','bird'].map(x=>'puzzle-pet-'+x),
 garden:['mushroom','flower','can','butterfly','bee','snail'].map(x=>'puzzle-garden-'+x),
 sweets:['teapot','cupcake','macaron','cookie','cup','berry'].map(x=>'puzzle-sweet-'+x),
 beauty:['lipstick','brush','perfume','polish','mirror','bow'].map(x=>'puzzle-beauty-'+x).concat('world-mascara','world-palette'),
};
// x/foot are normalized image coordinates, anchored to an authored support
// surface. w/h are local picture pixels (540 x 405), not a universal icon size.
const detail=(key,x,foot,w,h,change,extra={})=>({key,x,foot,w,h,change,...extra});
const composition=objects=>({objects,points:objects.map(o=>[o.x,o.foot-o.h/810])});
export const DIFFERENCES={
 tea:composition([
  detail('puzzle-sweet-teapot',.823,.409,49,43,'missing',{support:'right cupboard shelf'}),
  detail('puzzle-sweet-cup',.525,.559,36,28,'flip',{support:'window sill'}),
  detail('puzzle-sweet-macaron',.515,.815,55,38,'replace',{replacement:'puzzle-sweet-cupcake',support:'center placemat'}),
  detail('puzzle-sweet-cookie',.090,.850,29,19,'color',{flat:true,support:'left placemat'}),
  detail('puzzle-sweet-cupcake',.689,.773,35,40,'small',{support:'table beside center placemat'}),
 ]),
 garden:composition([
  detail('puzzle-garden-flower',.670,.637,43,55,'missing',{support:'metal side table'}),
  detail('puzzle-garden-can',.149,.819,54,47,'color',{support:'wooden stool'}),
  detail('puzzle-garden-butterfly',.825,.334,36,30,'replace',{replacement:'puzzle-garden-bee',shadow:false,support:'flowering window vine'}),
  detail('puzzle-garden-snail',.358,.901,43,25,'flip',{support:'foreground crate lid'}),
  detail('puzzle-garden-bee',.197,.685,26,24,'small',{shadow:false,support:'left rose bouquet'}),
 ]),
 vanity:composition([
  detail('puzzle-beauty-lipstick',.225,.536,32,43,'missing',{support:'lower left shelf'}),
  detail('puzzle-beauty-perfume',.803,.536,47,51,'color',{support:'lower right shelf'}),
  detail('puzzle-beauty-polish',.405,.861,35,40,'replace',{replacement:'puzzle-beauty-lipstick',support:'clear left side of vanity top'}),
  detail('puzzle-beauty-brush',.649,.867,51,23,'flip',{flat:true,support:'clear right side of vanity top'}),
  detail('puzzle-beauty-bow',.756,.215,38,22,'small',{flat:true,support:'upper right shelf beside keepsake box'}),
 ]),
 pets:composition([
  detail('puzzle-pet-cat',.272,.140,55,46,'missing',{support:'top cushion of cat tree'}),
  detail('puzzle-pet-dog',.547,.744,66,64,'color',{support:'center quilted cushion'}),
  detail('puzzle-pet-bunny',.274,.812,60,62,'replace',{replacement:'puzzle-pet-turtle',support:'cream floor bed'}),
  detail('puzzle-pet-bird',.390,.409,39,33,'flip',{support:'lower platform of cat tree'}),
  detail('puzzle-pet-hamster',.396,.582,39,34,'small',{support:'round pink bed'}),
 ]),
};
export const PUZZLE_LEVELS=[
 level('rescue-meadow','Meadow Guardian','rescue','meadow','puzzle-cat','Draw one shelter. Lift your finger and protect the kitten for 10 seconds.',{rescue:0}),
 level('rescue-pond','Pondside Puppy','rescue','pond','puzzle-dog','A tiny island, two hives. Rest your shelter on the stone.',{rescue:1}),
 level('rescue-orchard','Double Cuddle','rescue','orchard','puzzle-shield','Protect BOTH puppies with one line. Bridge their two little islands.',{rescue:2}),
 level('rescue-moon','Moonlight Rescue','rescue','moon','puzzle-hive','Use the tall pillars to support a roof. Keep all three swarms out.',{rescue:3}),
 level('difference-tea','Tea-Time Secrets','difference','tea','puzzle-diff-tea','Compare the two pictures. Tap each of the 5 differences.'),
 level('difference-garden','Garden Secrets','difference','garden','puzzle-diff-garden','Look closely at both gardens. Find 5 little changes.'),
 level('difference-vanity','Vanity Secrets','difference','vanity','puzzle-diff-vanity','Five details have changed. Tap them in either picture.'),
 level('difference-pets','Cozy Pet Secrets','difference','pets','puzzle-diff-pets','Compare the cozy rooms. Find all 5 differences.'),
 level('memo-pets','Pocket Pals','memo','pets','puzzle-back-pets','Turn over two cards. Remember the pets and match all 6 pairs.',{columns:4,limit:90}),
 level('memo-garden','Garden Memories','memo','garden','puzzle-back-garden','Match all 6 garden pairs. Take a peek, then trust your memory.',{columns:3,limit:100}),
 level('memo-sweets','Sweet Memories','memo','sweets','puzzle-back-sweets','Find the 6 matching treats. Every pair is a little celebration.',{columns:4,limit:90}),
 level('memo-beauty','Beauty Match','memo','beauty','puzzle-back-beauty','A bigger beauty box! Remember and match all 8 pairs.',{columns:4,limit:120}),
];
