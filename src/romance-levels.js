const stage=(name,hint,mechanic,tool)=>({name,hint,mechanic,tool,mode:'romance',seconds:10});
const cast=[
 ['rose','Rosie','Rose Garden Romance',0xe5a3b7],
 ['pearl','Chloe','Pearl Coast Promise',0xaadaca],
 ['violet','Amara','Violet Evening',0xb6a0df],
 ['cherry','Mei','Cherry Blossom Vows',0xf1b5cc],
 ['sunflower','Lucia','Sunflower Sweetheart',0xf1d38c],
 ['winter','Freya','Snowflake Fairytale',0xb5d6ed],
 ['amber','Sienna','Autumn in Love',0xe9b183],
 ['moon','Luna','Moonlit Ballroom',0xaca6d3],
 ['coral','Isla','Coral Island Kiss',0xf1b0a7],
 ['emerald','Zara','Emerald Royal Wedding',0xadd4b3],
];
export const ROMANCE_LEVELS=cast.map(([theme,girl,name,color],variant)=>({
 id:'romance-'+theme,name,subtitle:`${girl}'s new chapter`,kind:'romance',character:'cat',hero:`romance-${theme}-bride`,theme,girl,color,variant,
 steps:[
  stage('A warm welcome','Wash each muddy patch. Gentle circles make soft bubbles.','wash','romance-shower'),
  stage('A lovely new hairstyle','Hold and brush down each glowing strand. Keep holding between strands.','hair','romance-brush'),
  stage('Her dream dress','Drag the dress onto her, then pull the golden zipper upward.','dress',`romance-${theme}-gown`),
  stage('A little sparkle','Place the necklace and hair jewel on their glowing outlines.','jewels','romance-necklace'),
  stage('Look how far she has come','Slide the handle all the way right to reveal her new look.','compare','romance-tiara'),
  stage('A question from the heart','Drag the diamond ring into the glowing heart.','proposal','romance-ring'),
  stage('Their happily ever after','Enjoy the wedding. Tap the hearts, then keep this moment.','wedding','romance-ringbox'),
 ]
}));
