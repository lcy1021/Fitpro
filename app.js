window.duoStartApp=function(){
window.duoAppStarted=true;window.duoBootTrace?.mark("app-start");

/* Supabase 配置写在同目录的 config.js 里，这个文件以后可以直接整个替换 */
const SUPABASE_URL = String((window.FATLOSS_CONFIG||{}).SUPABASE_URL||"").trim();
const SUPABASE_KEY = String((window.FATLOSS_CONFIG||{}).SUPABASE_KEY||"").trim();
const AI_KCAL = !!(window.FATLOSS_CONFIG||{}).AI_KCAL; // 部署了 meal-kcal 函数后在 config.js 里打开
const AI_REGION = String((window.FATLOSS_CONFIG||{}).AI_REGION||"").trim(); // 固定函数运行的地区（和 Supabase 项目同一地区），避免被分到连不上 Claude 的节点
(function(){
"use strict";

/* ---------- plan content ---------- */
const PEOPLE = { hus:{label:"老公"}, wife:{label:"老婆"} };
const MEALS = ["breakfast","lunch","snack","dinner"];
const icon=(name,size="")=>`<svg class="ui-icon${size?" "+size:""}" viewBox="0 0 24 24" aria-hidden="true"><use href="#ic-${name}"></use></svg>`;
const MEAL_PLAN = {
  hus:{
    breakfast:{t:"早餐",time:"7:00",food:"鸡蛋 2 个 + 牛奶或无糖豆浆 250ml + 全麦面包 2 片（或玉米 1 根）"},
    lunch:{t:"午餐",time:"12:00",food:"外卖或食堂，米饭吃 2/3 份，一定要有一份明显的肉、蛋或鱼"},
    snack:{t:"下午加餐",time:"16:00",food:"无糖酸奶 1 盒 + 1 个水果；喝拿铁的话就把它当加餐，不再吃别的"},
    dinner:{t:"晚餐",time:"20:00 后",food:"瘦肉或鱼虾 150g + 蔬菜 300g + 少量主食（半碗饭，可省）"},
    protein:"约 120–130g"
  },
  wife:{
    breakfast:{t:"早餐",time:"7:00",food:"鸡蛋 1 个 + 牛奶或无糖豆浆 250ml + 全麦面包 1 片（或半根玉米）"},
    lunch:{t:"午餐",time:"12:00",food:"同样的套餐，米饭吃 1/2 份，菜可以吃完"},
    snack:{t:"下午加餐",time:"16:00",food:"无糖酸奶 1 盒，或 1 个水果，或一杯拿铁（三选一）"},
    dinner:{t:"晚餐",time:"20:00 后",food:"瘦肉或鱼虾 100g + 蔬菜 250g，主食可以不吃"},
    protein:"约 80–90g"
  }
};
/* 每餐的具体食物：k 是热量区间 [低, 高] kcal；or 是可替换的选项；opt 表示可省；pick1 表示几样里选一样 */
const MEAL_FOODS = {
  hus:{
    breakfast:{items:[
      {n:"水煮蛋",q:"2 个",k:[140,140]},
      {n:"纯牛奶",q:"250ml",k:[165,165],or:{n:"无糖豆浆",k:[80,80]}},
      {n:"全麦面包",q:"2 片",k:[160,160],or:{n:"玉米 1 根",k:[110,110]},a:{g:2,min:1,max:3,step:1,kpg:80,u:"slice",pri:5}}]},
    lunch:{items:[
      {n:"米饭",q:"2/3 碗（约 130g）",k:[150,150],a:{g:130,min:80,max:250,step:10,kpg:1.16,u:"rice",pri:3}},
      {n:"荤菜一份",q:"约一个手掌大小",k:[250,350]},
      {n:"素菜一份",q:"一拳以上",k:[100,200]}]},
    snack:{items:[
      {n:"无糖酸奶",q:"1 盒",k:[100,130]},
      {n:"水果",q:"1 个（苹果、橙子等）",k:[60,90]},
      {n:"原味坚果",q:"",k:[0,0],a:{g:0,min:0,max:20,step:5,kpg:6,u:"nut",pri:2}}],
      alt:{n:"或者只喝一杯拿铁",k:[150,190]}},
    dinner:{items:[
      {n:"瘦肉或鱼虾",q:"150g",k:[150,250],a:{g:150,min:100,max:250,step:10,kpg:[1,1.67],u:"g",pri:4}},
      {n:"蔬菜",q:"300g",k:[60,90]},
      {n:"米饭",q:"半碗（约 100g，可省）",k:[115,115],opt:true,a:{g:100,min:0,max:200,step:10,kpg:1.16,u:"rice",pri:1}},
      {n:"做菜用油",q:"约半勺",k:[45,45]}]}
  },
  wife:{
    breakfast:{items:[
      {n:"水煮蛋",q:"1 个",k:[70,70]},
      {n:"纯牛奶",q:"250ml",k:[165,165],or:{n:"无糖豆浆",k:[80,80]}},
      {n:"全麦面包",q:"1 片",k:[80,80],or:{n:"半根玉米",k:[55,55]},a:{g:1,min:1,max:2,step:1,kpg:80,u:"slice",pri:5}}]},
    lunch:{items:[
      {n:"米饭",q:"半碗（约 100g）",k:[115,115],a:{g:100,min:60,max:180,step:10,kpg:1.16,u:"rice",pri:3}},
      {n:"荤菜一份",q:"约一个手掌大小",k:[250,350]},
      {n:"素菜一份",q:"一拳以上",k:[100,200]}]},
    snack:{pick1:true,items:[
      {n:"无糖酸奶",q:"1 盒",k:[100,130]},
      {n:"水果",q:"1 个",k:[60,90]},
      {n:"拿铁",q:"1 杯",k:[150,190]}]},
    dinner:{items:[
      {n:"瘦肉或鱼虾",q:"100g",k:[100,170],a:{g:100,min:80,max:180,step:10,kpg:[1,1.7],u:"g",pri:4}},
      {n:"蔬菜",q:"250g",k:[50,75]},
      {n:"米饭",q:"1/3 碗（可不吃）",k:[75,75],opt:true,a:{g:75,min:0,max:150,step:10,kpg:1.16,u:"rice",pri:1}},
      {n:"做菜用油",q:"约半勺",k:[45,45]}]}
  }
};
function mealRange(f){
  let lo, hi;
  if(f.pick1){ lo=Math.min(...f.items.map(i=>i.k[0])); hi=Math.max(...f.items.map(i=>i.k[1])); }
  else{
    lo=0; hi=0;
    f.items.forEach(i=>{ const l=i.or?Math.min(i.k[0],i.or.k[0]):i.k[0], h=i.or?Math.max(i.k[1],i.or.k[1]):i.k[1]; lo+=i.opt?0:l; hi+=h; });
    if(f.alt){ lo=Math.min(lo,f.alt.k[0]); hi=Math.max(hi,f.alt.k[1]); }
  }
  return [lo,hi];
}
const kcalText=r=>r[0]===r[1]?`${r[0]}`:`${r[0]}–${r[1]}`;
function mealKcal(person,meal){ return kcalText(mealRange(menuFor(person)[meal])); }
function dayRange(person){ return MEALS.map(m=>mealRange(menuFor(person)[m])).reduce((a,r)=>[a[0]+r[0],a[1]+r[1]],[0,0]); }
function dayKcal(person){ return `约 ${kcalText(dayRange(person))} kcal`; }

/* ---------- 常见食物库：[名称, 别名(|分隔), 每100g热量kcal, {单位:每单位克数}, 默认单位] ----------
   数值参考《中国食物成分表》第6版常见值；外卖菜按常见一份的重量和做法估算，只作参考 */
const FOOD_DB=[
  /* 主食 */
  ["米饭","白米饭|大米饭|白饭|饭",116,{碗:200,小碗:130,大碗:300,两:50,份:250,勺:40},"碗"],
  ["糙米饭","杂粮饭|五谷饭",111,{碗:200,份:250},"碗"],
  ["馒头","白馒头",223,{个:100,两:50},"个"],
  ["花卷","",214,{个:80},"个"],
  ["面条","汤面|挂面|素面",107,{碗:300,份:300,两:100},"碗"],
  ["牛肉面","兰州拉面|拉面|牛肉拉面",120,{碗:550,份:550},"碗"],
  ["炸酱面","",180,{碗:400,份:400},"碗"],
  ["热干面","",200,{碗:300,份:300},"碗"],
  ["炒面","",180,{份:350,盘:350},"份"],
  ["方便面","泡面",470,{包:100,桶:110},"包"],
  ["米线","米粉|过桥米线",100,{碗:450,份:450},"碗"],
  ["螺蛳粉","",130,{碗:450,份:450},"碗"],
  ["粥","白粥|大米粥|稀饭",46,{碗:300,份:300},"碗"],
  ["小米粥","",46,{碗:300},"碗"],
  ["皮蛋瘦肉粥","",70,{碗:350,份:350},"碗"],
  ["燕麦片","燕麦|麦片",377,{份:40,勺:10,碗:40},"份"],
  ["全麦面包","全麦吐司",246,{片:35,个:80},"片"],
  ["吐司","白吐司|切片面包",270,{片:35},"片"],
  ["面包","甜面包|餐包",313,{个:90,片:35},"个"],
  ["玉米","甜玉米|糯玉米",112,{根:100,个:100,段:50},"根"],
  ["红薯","地瓜|烤红薯",86,{个:200,块:100},"个"],
  ["紫薯","",106,{个:150},"个"],
  ["土豆","马铃薯",77,{个:150},"个"],
  ["包子","肉包|肉包子|鲜肉包|大肉包",227,{个:80},"个"],
  ["菜包","青菜包|香菇青菜包|萝卜丝包|素包|菜包子|粉丝包",190,{个:80},"个"],
  ["五丁包","三丁包|五丁包子|三丁包子",250,{个:110},"个"],
  ["豆沙包","奶黄包|流沙包|叉烧包",260,{个:60},"个"],
  ["生煎包","生煎",230,{个:40,两:200},"个"],
  ["小笼包","小笼",230,{个:25,笼:200},"个"],
  ["饺子","水饺|煮饺子",220,{个:20,两:100,盘:300,份:300},"个"],
  ["煎饺","锅贴",260,{个:25,份:250},"个"],
  ["馄饨","云吞|抄手",150,{碗:300,个:15,份:300},"碗"],
  ["烧卖","烧麦",238,{个:35},"个"],
  ["油条","",388,{根:80},"根"],
  ["煎饼果子","煎饼",240,{个:200,份:200},"个"],
  ["手抓饼","",300,{个:150},"个"],
  ["肉夹馍","",270,{个:150},"个"],
  ["烧饼","",300,{个:100},"个"],
  ["葱油饼","",300,{块:100,个:120},"块"],
  ["粽子","肉粽",200,{个:150},"个"],
  ["年糕","",154,{份:150,块:50},"份"],
  ["饭团","",180,{个:120},"个"],
  ["三明治","",230,{个:150,份:150},"个"],
  ["汉堡","汉堡包|巨无霸",250,{个:200},"个"],
  ["披萨","比萨",260,{块:100,角:100,个:500},"块"],
  ["薯条","",310,{份:110,中份:110,大份:150,小份:75},"份"],
  ["寿司","",150,{个:30,份:240},"个"],
  /* 盖饭套餐（含米饭） */
  ["黄焖鸡米饭","黄焖鸡",160,{份:550,碗:550},"份"],
  ["盖浇饭","盖饭",150,{份:550},"份"],
  ["鸡腿饭","卤鸡腿饭",160,{份:500},"份"],
  ["猪脚饭","隆江猪脚饭",180,{份:500},"份"],
  ["卤肉饭","",170,{份:400,碗:400},"份"],
  ["咖喱饭","咖喱鸡饭|咖喱牛肉饭",150,{份:500},"份"],
  ["炒饭","蛋炒饭|扬州炒饭",185,{份:350,盘:350,碗:300},"份"],
  ["煲仔饭","",170,{份:500},"份"],
  ["石锅拌饭","拌饭",140,{份:500},"份"],
  ["日式定食","定食",140,{份:500},"份"],
  ["便当","盒饭|快餐",150,{份:500,盒:500},"份"],
  /* 家常菜 / 外卖菜（按一份） */
  ["宫保鸡丁","",230,{份:250,盘:250,勺:40},"份"],
  ["番茄炒蛋","西红柿炒鸡蛋|西红柿炒蛋|番茄炒鸡蛋",90,{份:250,盘:250},"份"],
  ["鱼香肉丝","",200,{份:250,盘:250},"份"],
  ["麻婆豆腐","",130,{份:300,盘:300},"份"],
  ["回锅肉","",290,{份:250,盘:250},"份"],
  ["红烧肉","",470,{份:200,块:30,盘:200},"份"],
  ["糖醋里脊","糖醋排骨|锅包肉",280,{份:250,盘:250},"份"],
  ["青椒肉丝","",160,{份:250,盘:250},"份"],
  ["土豆丝","酸辣土豆丝|炒土豆丝",120,{份:250,盘:250},"份"],
  ["地三鲜","",200,{份:300,盘:300},"份"],
  ["干煸豆角","干煸四季豆",170,{份:250,盘:250},"份"],
  ["炒青菜","清炒青菜|蒜蓉青菜|炒时蔬|素菜|炒菜心",60,{份:250,盘:250},"份"],
  ["蒜蓉西兰花","炒西兰花",60,{份:250,盘:250},"份"],
  ["凉拌黄瓜","拍黄瓜",50,{份:200,盘:200},"份"],
  ["木须肉","",170,{份:250,盘:250},"份"],
  ["水煮肉片","",200,{份:400,盘:400},"份"],
  ["水煮鱼","",150,{份:500,盆:500},"份"],
  ["酸菜鱼","",120,{份:600,盆:600},"份"],
  ["清蒸鱼","蒸鱼",110,{份:300,条:300,盘:300},"份"],
  ["红烧鱼","",150,{份:300,条:300},"份"],
  ["可乐鸡翅","鸡翅",220,{个:40,只:40,份:250},"个"],
  ["辣子鸡","",280,{份:250,盘:250},"份"],
  ["口水鸡","白切鸡|手撕鸡",180,{份:250,盘:250},"份"],
  ["烤鸭","北京烤鸭",270,{份:250,片:15},"份"],
  ["卤牛肉","酱牛肉",190,{份:150,片:15},"份"],
  ["牛排","",200,{块:200,份:200},"块"],
  ["炸鸡","炸鸡块|鸡块",280,{块:80,个:80,份:250},"块"],
  ["鸡米花","",300,{份:120},"份"],
  ["麻辣烫","",90,{份:600,碗:600},"份"],
  ["麻辣香锅","香锅",180,{份:500},"份"],
  ["冒菜","",110,{份:500},"份"],
  ["火锅","",150,{顿:700,份:700},"顿"],
  ["关东煮","",60,{串:60,份:300},"串"],
  ["烤串","烧烤|羊肉串|肉串",250,{串:25,把:250},"串"],
  ["沙拉","轻食沙拉|蔬菜沙拉|鸡胸沙拉",110,{份:350,碗:350},"份"],
  ["沙拉酱","千岛酱|蛋黄酱|凯撒酱",480,{勺:15,包:30,份:30},"勺"],
  ["油醋汁","",200,{勺:15,包:30},"勺"],
  ["凉皮","",150,{份:300,碗:300},"份"],
  ["酸辣粉","",140,{碗:400,份:400},"碗"],
  /* 蛋奶豆 */
  ["鸡蛋","水煮蛋|白煮蛋|煮鸡蛋|蛋",144,{个:50,只:50},"个"],
  ["茶叶蛋","卤蛋",150,{个:50},"个"],
  ["煎蛋","荷包蛋|煎鸡蛋",200,{个:50},"个"],
  ["蒸蛋","鸡蛋羹|蛋羹",80,{碗:150,份:150},"碗"],
  ["牛奶","纯牛奶|全脂奶|鲜奶",65,{杯:250,盒:250,瓶:250,ml:1},"盒"],
  ["脱脂奶","脱脂牛奶|低脂奶|低脂牛奶|脱脂高钙牛奶|脱脂高钙奶|高钙脱脂奶|高钙低脂奶|低脂高钙奶|高钙牛奶|高钙奶",35,{杯:250,盒:250,瓶:250,个:250,ml:1},"盒"],
  ["无糖豆浆","豆浆",31,{杯:250,碗:300,ml:1},"杯"],
  ["甜豆浆","",52,{杯:250,碗:300,ml:1},"杯"],
  ["无糖酸奶","原味酸奶|希腊酸奶",72,{盒:100,杯:150,碗:150},"盒"],
  ["酸奶","含糖酸奶|风味酸奶",90,{盒:100,杯:200,瓶:200},"盒"],
  ["奶酪","芝士",330,{片:18,块:20},"片"],
  ["豆腐","北豆腐|嫩豆腐",81,{块:150,份:200},"块"],
  ["豆腐干","香干|豆干",140,{块:30,份:100},"块"],
  /* 肉蛋白 */
  ["鸡胸肉","鸡胸",133,{块:150,份:150,两:50},"份"],
  ["鸡腿肉","去皮鸡腿|鸡腿",150,{个:120,只:120,份:150,两:50},"个"],
  ["瘦猪肉","猪瘦肉|里脊|猪里脊",143,{份:150,两:50},"份"],
  ["五花肉","",568,{份:100,两:50,片:15},"份"],
  ["排骨","猪排骨",278,{份:200,块:30,两:50},"份"],
  ["牛肉","瘦牛肉|牛腱",125,{份:150,两:50},"份"],
  ["羊肉","",203,{份:150,两:50},"份"],
  ["虾仁","",48,{份:150,两:50,个:8},"份"],
  ["虾","基围虾|白灼虾|大虾",101,{份:200,只:15,个:15,两:50},"份"],
  ["三文鱼","",139,{份:150,片:15},"份"],
  ["鲈鱼","龙利鱼|鳕鱼|鱼肉|鱼",100,{份:150,两:50},"份"],
  ["午餐肉","",229,{片:25,罐:340},"片"],
  ["火腿肠","香肠|烤肠",212,{根:50,个:50},"根"],
  ["培根","",300,{片:15},"片"],
  /* 蔬菜 */
  ["西兰花","",36,{份:200,颗:300},"份"],
  ["青菜","菠菜|油菜|生菜|白菜|菜心|蔬菜",20,{份:200,把:250,两:50},"份"],
  ["黄瓜","",16,{根:200,个:200},"根"],
  ["番茄","西红柿|小番茄|圣女果",20,{个:180,份:200},"个"],
  ["胡萝卜","",32,{根:120,个:120},"根"],
  ["金针菇","蘑菇|香菇|菌菇",32,{份:150,把:150},"份"],
  /* 水果 */
  ["苹果","",53,{个:200},"个"],
  ["香蕉","",93,{根:120,个:120},"根"],
  ["橙子","橙|橘子|桔子|柑",48,{个:150},"个"],
  ["梨","",51,{个:220},"个"],
  ["葡萄","提子",45,{串:250,份:150,颗:5},"份"],
  ["西瓜","",31,{块:250,片:250,份:300},"块"],
  ["草莓","",32,{份:150,颗:15,个:15},"份"],
  ["蓝莓","",57,{盒:125,份:100},"盒"],
  ["猕猴桃","奇异果",61,{个:90},"个"],
  ["芒果","",35,{个:200},"个"],
  ["桃子","桃",42,{个:180},"个"],
  ["哈密瓜","甜瓜",34,{块:200,份:250},"块"],
  ["火龙果","",55,{个:300},"个"],
  ["柚子","",42,{瓣:80,份:200},"瓣"],
  ["樱桃","车厘子",46,{份:150,颗:8,个:8},"份"],
  ["水果","",50,{份:200,个:150},"份"],
  /* 零食甜点 */
  ["坚果","混合坚果|每日坚果|核桃|杏仁|腰果",610,{把:15,包:25,份:25,颗:2,个:2},"把"],
  ["花生","花生米",574,{把:20,份:30,颗:1},"把"],
  ["蛋糕","奶油蛋糕|芝士蛋糕",350,{块:100,个:100},"块"],
  ["饼干","苏打饼干|曲奇",450,{片:8,块:8,包:50},"片"],
  ["薯片","",550,{包:70,小包:30},"包"],
  ["巧克力","",550,{块:20,排:100},"块"],
  ["冰淇淋","雪糕|冰激凌",200,{个:100,支:80,球:60},"个"],
  ["蛋挞","",375,{个:60},"个"],
  ["月饼","",420,{个:100},"个"],
  ["辣条","",480,{包:30},"包"],
  /* 饮品 */
  ["美式咖啡","美式|黑咖啡|咖啡",2,{杯:350,ml:1},"杯"],
  ["拿铁","咖啡拿铁|拿铁咖啡",50,{杯:380,中杯:380,大杯:470,小杯:260,ml:1},"杯"],
  ["燕麦拿铁","燕麦奶拿铁",45,{杯:380,ml:1},"杯"],
  ["生椰拿铁","厚乳拿铁",70,{杯:380,ml:1},"杯"],
  ["卡布奇诺","",40,{杯:300,ml:1},"杯"],
  ["奶茶","珍珠奶茶|全糖奶茶",75,{杯:500,中杯:500,大杯:700,ml:1},"杯"],
  ["少糖奶茶","三分糖奶茶|半糖奶茶",55,{杯:500,ml:1},"杯"],
  ["无糖茶","茶|绿茶|乌龙茶|红茶",0,{杯:500,瓶:500,ml:1},"杯"],
  ["可乐","雪碧|汽水",43,{罐:330,瓶:500,杯:350,ml:1},"罐"],
  ["无糖可乐","零度可乐|健怡可乐|气泡水|苏打水",0,{罐:330,瓶:500,ml:1},"罐"],
  ["果汁","橙汁|鲜榨果汁",46,{杯:300,瓶:300,ml:1},"杯"],
  ["啤酒","",43,{罐:330,瓶:500,杯:300,ml:1},"罐"],
  ["红酒","葡萄酒",72,{杯:150,ml:1},"杯"],
  ["白酒","",298,{两:50,杯:25,ml:1},"两"],
  ["蛋白粉","蛋白奶昔",380,{勺:30,份:30},"勺"],
  /* 调味 */
  ["食用油","油|炒菜油",899,{勺:10,ml:1,g:1},"勺"],
  ["白糖","砂糖",400,{勺:10,块:5},"勺"]
];

/* ---------- 一句话 → 食物和热量 ---------- */
const FOOD_IDX=(()=>{ const list=[]; FOOD_DB.forEach(f=>{ [f[0]].concat(f[1]?f[1].split("|"):[]).forEach(a=>list.push([a,f])); }); return list.sort((x,y)=>y[0].length-x[0].length); })();
const UNITS="碗|个|只|份|杯|罐|瓶|片|块|根|串|盒|勺|包|两|盘|条|把|颗|段|笼|桶|支|球|角|排|瓣|顿|盆|g|克|ml|毫升|ML|G";
const CN_NUM={半:.5,一:1,二:2,两:2,俩:2,三:3,四:4,五:5,六:6,七:7,八:8,九:9,十:10};
const numOf=t=>{ if(!t) return null; if(/^\d/.test(t)) return parseFloat(t); if(t==="十") return 10; if(t.length===2&&t[0]==="十") return 10+(CN_NUM[t[1]]||0); if(t.length===2&&t[1]==="十") return (CN_NUM[t[0]]||1)*10; return CN_NUM[t]??null; };
const QTY_PRE=new RegExp("(\\d+(?:\\.\\d+)?|[半一二两俩三四五六七八九十]{1,2})?\\s*(小|大|中)?\\s*("+UNITS+")?\\s*(?:的)?\\s*$");
const QTY_PRE_LOOSE=new RegExp("(\\d+(?:\\.\\d+)?|[半一二两俩三四五六七八九十]{1,2})\\s*(小|大|中)?\\s*("+UNITS+")\\s*(?:的)?[\\u4e00-\\u9fa5]{0,6}$");
const QTY_SUF=new RegExp("^\\s*(\\d+(?:\\.\\d+)?|[半一二两俩三四五六七八九十]{1,2})?\\s*(小|大|中)?\\s*("+UNITS+")?");
function foodKcal(f,num,size,unit){
  const units=f[3]; let n=num==null?1:num, u=unit, grams;
  if(u) u=u.toLowerCase();
  if(u==="g"||u==="克"){ grams=n; u="g"; }
  else if(u==="ml"||u==="毫升"){ grams=n; u="ml"; }
  else{
    const sized = size && u ? size+u : null;
    if(sized && units[sized]){ grams=n*units[sized]; u=sized; }
    else{
      if(!u || !units[u]) u=f[4];
      grams=n*units[u]*(size==="小"?0.7:size==="大"?1.4:1);
      if(size && size!=="中") u=size+u;
    }
  }
  const q = (u==="g"||u==="ml") ? `${n}${u}` : `${n===0.5?"半":n}${u}`;
  return {n:f[0], q, k:Math.round(grams*f[2]/100/5)*5};
}
function parseMeal(text){
  const out=[];
  String(text||"").split(/[，,、；;。！!\n+＋]|和|跟|还有|以及|加上|外加|配/).map(x=>x.trim()).filter(Boolean).forEach(seg=>{
    const hits=[]; let i=0;
    while(i<seg.length){
      const m=FOOD_IDX.find(([a])=>a && seg.startsWith(a,i));
      if(m){ hits.push({s:i,e:i+m[0].length,f:m[1]}); i+=m[0].length; } else i++;
    }
    if(!hits.length){ out.push({n:seg,q:"",k:null,miss:true}); return; }
    let used=0; // 前一个食物已经用掉的后缀长度
    hits.forEach((h,j)=>{
      const pre=seg.slice((j?hits[j-1].e:0)+used,h.s), sufEnd=j<hits.length-1?hits[j+1].s:seg.length, suf=seg.slice(h.e,sufEnd);
      let m=pre.match(QTY_PRE); used=0;
      if(!m||(!m[1]&&!m[3])){ const m2=pre.match(QTY_PRE_LOOSE); if(m2) m=m2; } // "200ml的脱脂高钙" 这类量词和食物之间有修饰词
      if(!m||(!m[1]&&!m[3])){ m=suf.match(QTY_SUF); if(m&&(m[1]||m[3])) used=m[0].length; }
      out.push(foodKcal(h.f, m?numOf(m[1]):null, m?m[2]:null, m?m[3]:null));
    });
  });
  return out;
}

/* ---------- 目标：按身高、年龄、体重算每天热量，再调份量 ---------- */
const GOAL_FLOOR={hus:1500,wife:1200};           // 每天热量下限
const PACE={gentle:{def:300,label:"温和",kg:"约 0.3 kg"},standard:{def:500,label:"标准",kg:"约 0.5 kg"}};
const MAX_LEVEL={hus:1,wife:1}, MIN_LEVEL={hus:-1,wife:0}; // 训练轮数在默认基础上最多 +1 / −1（老婆最少 2 轮）
/* 目标存在身体记录的 goal 字段里：取最近一条带 goal 的记录 */
function goalOf(person){ const ms=measureSeries(person); for(let i=ms.length-1;i>=0;i--) if(ms[i].goal) return ms[i].goal; return null; }
function latestWeight(person){ const ms=measureSeries(person); for(let i=ms.length-1;i>=0;i--) if(typeof ms[i].weight==="number") return ms[i].weight; return null; }
const minHealthy=h=>Math.ceil(18.5*(h/100)*(h/100)*10)/10;   // BMI 18.5 对应的体重
function calcPlan(person,g,w){
  const bmr=10*w+6.25*g.height-5*g.age+(person==="hus"?5:-161);
  const tdee=Math.round(bmr*1.35/10)*10;                       // 久坐上班 + 每周练 3 次
  const toGo=Math.round((w-g.target)*10)/10;
  const maintain = g.mode==="maintain" || toGo<=0;
  const deficit = maintain ? 0 : Math.min(PACE[g.pace||"gentle"].def, Math.round(w*0.01*7700/7)); // 每周不超过体重 1%
  let kcal=Math.max(GOAL_FLOOR[person], Math.min(tdee-deficit+(g.adj||0), tdee+300));
  kcal=Math.round(kcal/10)*10;
  const perWeek = maintain ? 0 : Math.max(0.1, Math.round((tdee-kcal)*7/7700*10)/10);
  const weeks = maintain ? 0 : Math.max(1, Math.ceil(toGo/perWeek));
  return {g,w,tdee,kcal,toGo,maintain,perWeek,weeks,protein:Math.round(Math.min(w,g.target+5)*1.6/5)*5};
}
function planFor(person){ const g=goalOf(person); if(!g) return null; return calcPlan(person,g,latestWeight(person)||g.start); }

const riceText=g=>{ const b=g/200; const t=b<=.35?"小半碗":b<=.55?"半碗":b<=.8?"大半碗":b<=1.1?"1 碗":"1 碗多"; return `${t}（约 ${g}g）`; };
function knobItem(it,g){
  const a=it.a, kp=Array.isArray(a.kpg)?a.kpg:[a.kpg,a.kpg];
  const k=[Math.round(g*kp[0]/5)*5, Math.round(g*kp[1]/5)*5];
  const q = a.u==="rice"?riceText(g):a.u==="slice"?`${g} 片`:a.u==="nut"?`${g}g（约一小把）`:`${g}g`;
  const same=g===a.g;
  return {...it, q: same?it.q:q, k: same?it.k:k, opt: same?it.opt:false, a:{...a,g}};
}
const midOf=r=>(r[0]+r[1])/2;
let menuCache={};
/* 按热量目标调份量：优先调晚餐米饭、坚果、午餐米饭，其次荤菜和面包 */
function menuFor(person){
  const plan=planFor(person); if(!plan) return MEAL_FOODS[person];
  const key=person+plan.kcal; if(menuCache[key]) return menuCache[key];
  const menu={}; MEALS.forEach(m=>{ menu[m]={...MEAL_FOODS[person][m], items:MEAL_FOODS[person][m].items.map(i=>({...i}))}; });
  const knobs=[]; MEALS.forEach(m=>menu[m].items.forEach((it,idx)=>{ if(it.a) knobs.push({m,idx}); }));
  knobs.sort((x,y)=>menu[x.m].items[x.idx].a.pri-menu[y.m].items[y.idx].a.pri);
  const total=()=>MEALS.reduce((t,m)=>t+midOf(mealRange(menu[m])),0);
  for(let n=0;n<120;n++){
    const D=plan.kcal-total(); if(Math.abs(D)<35) break;
    const dir=Math.sign(D); let moved=false;
    for(const kb of knobs){
      const it=menu[kb.m].items[kb.idx], a=it.a, ng=a.g+dir*a.step;
      if(ng<a.min||ng>a.max) continue;
      const stepK=a.step*midOf(Array.isArray(a.kpg)?a.kpg:[a.kpg,a.kpg]);
      if(stepK/2>Math.abs(D)) continue;
      menu[kb.m].items[kb.idx]=knobItem(it,ng); moved=true; break;
    }
    if(!moved) break;
  }
  MEALS.forEach(m=>{ menu[m].items=menu[m].items.filter(i=>!(i.a&&i.a.g===0)); });
  return (menuCache[key]=menu);
}

/* ---------- 每周建议：看体重趋势和训练完成情况，确认后才改 ---------- */
function weightTrend(person,days){
  const since=addDays(new Date(),-days);
  const pts=measureSeries(person).filter(m=>typeof m.weight==="number" && m.date>=ymd(since))
    .map(m=>[(new Date(m.date+"T00:00:00")-since)/864e5, m.weight]);
  if(pts.length<3 || pts[pts.length-1][0]-pts[0][0]<days*0.5) return null;
  const n=pts.length, mx=pts.reduce((a,p)=>a+p[0],0)/n, my=pts.reduce((a,p)=>a+p[1],0)/n;
  const sxy=pts.reduce((a,p)=>a+(p[0]-mx)*(p[1]-my),0), sxx=pts.reduce((a,p)=>a+(p[0]-mx)**2,0);
  return sxx? sxy/sxx*7 : null; // kg/周，负数是在下降
}
function trainingDone(person,days){
  let done=0, need=0;
  for(let i=1;i<=days;i++){ const d=addDays(new Date(),-i); const s=scheduleFor(person,d);
    if(s.kind==="train"){ need++; if(getCheckin(person,ymd(d)).workout==="done") done++; } }
  return [done,need];
}
const daysSince=date=>Math.floor((new Date(ymd(new Date())+"T00:00:00")-new Date(date+"T00:00:00"))/864e5);
function suggestionsFor(person){
  const p=planFor(person); if(!p || daysSince(p.g.at)<7) return [];
  const out=[], g=p.g, lv=g.level||0;
  const fast=weightTrend(person,14), flat=weightTrend(person,21);
  const [done,need]=trainingDone(person,14), lowDone = need>=4 && done<need/2; // 计划没怎么做时，体重不动不代表吃多了
  if(!p.maintain && p.toGo<=1) out.push({k:"maintain",t:`离目标只差 ${p.toGo} kg 了`,d:"建议切换到维持：每天吃到消耗量，保持住就好"});
  else if(fast!==null && -fast>p.w*0.01) out.push({k:"adj",v:150,t:`最近每周掉约 ${Math.abs(fast).toFixed(1)} kg，有点快`,d:"建议每天多吃约 150 kcal，减得稳一点更不容易反弹"});
  else if(!p.maintain && flat!==null && Math.abs(flat)<0.1 && !lowDone){
    if(p.kcal-150>=GOAL_FLOOR[person]) out.push({k:"adj",v:-150,t:"体重 3 周基本没动",d:"建议每天少吃约 150 kcal（主要减晚餐米饭）"});
    if(!g.cardio) out.push({k:"cardio",t:"加一次快走",d:"周四加一次可选的快走 30 分钟，推婴儿车散步也算"});
  }
  if(need>=4 && done===need && lv<MAX_LEVEL[person]) out.push({k:"level",v:1,t:"这两周训练全部完成了 💪",d:`建议每次多练一轮（${roundsFor(person==="hus"?"A":"W",person)} 轮 → ${roundsFor(person==="hus"?"A":"W",person)+1} 轮）`});
  else if(lowDone && lv>MIN_LEVEL[person]) out.push({k:"level",v:-1,t:"最近有点忙？",d:"建议先每次少练一轮，保持节奏比练多更重要"});
  return out;
}
function roundsFor(key,person){
  const w=WORKOUTS[key]; if(!w || key==="D" || key==="C") return w?w.rounds:1;
  if(privateCoach?.active && person===me && getCheckin(me,ymd(new Date())).dailyChoice==="short") return 1;
  if(privateCoach?.active && person===me){const duration=privateCoach.profile?.duration;if(duration==="10 分钟")return 1;if(duration==="30 分钟")return Math.min(4,w.rounds+1);}
  const g=goalOf(person); return w.rounds+((g&&g.level)||0);
}
/* 把目标写进今天的身体记录（和今天已有的体重、围度合并） */
function saveGoal(person,patch){
  const today=ymd(new Date()); const ex=store.measures[person+"_"+today]||{person,date:today};
  const old=goalOf(person)||{};
  putMeasure({...ex, person, date:today, goal:{...old, ...patch, at:today}});
}
const DINNERS = {
  1:{n:"番茄虾仁炒蛋 + 白灼菜心",h:"虾仁提前解冻，少油快炒",kcal:{hus:"380–480",wife:"260–330"}},
  2:{n:"空气炸锅鸡腿肉 + 凉拌黄瓜",h:"去皮鸡腿肉用黑胡椒、生抽腌好，200℃ 烤 15 分钟",kcal:{hus:"400–500",wife:"280–340"}},
  3:{n:"番茄牛肉菌菇汤",h:"牛肉片 + 番茄 + 金针菇 + 青菜，一锅出",kcal:{hus:"350–450",wife:"240–310"}},
  4:{n:"清蒸鱼 + 蒜蓉西兰花",h:"龙利鱼或鲈鱼蒸 8–10 分钟，淋少量蒸鱼豉油",kcal:{hus:"300–400",wife:"200–270"}},
  5:{n:"虾仁豆腐蔬菜汤 + 卤蛋",h:"豆腐补蛋白质，热乎又顶饱",kcal:{hus:"380–480",wife:"270–340"}}
};
const WORKOUTS = {
  A:{name:"训练 A",who:"hus",rounds:3,restMove:15,restRound:60,equip:"一对哑铃 + 瑜伽垫",
    warm:["开合跳 30 秒","徒手深蹲 10 个","手臂绕环 30 秒","原地高抬腿 30 秒"],
    cool:["大腿前侧、后侧拉伸各 20 秒","胸部拉伸 20 秒","猫牛式 5 次"],
    moves:[
      {n:"高脚杯深蹲",img:"a-goblet-squat",r:"12 次",c:"双手捧哑铃在胸前，蹲到大腿平行地面，膝盖和脚尖同向"},
      {n:"哑铃俯身划船",img:"a-db-row",r:"每侧 10 次",c:"一手撑凳，背部平直，把哑铃拉向腰侧"},
      {n:"俯卧撑",img:"a-push-up",r:"8–12 次",c:"做不了就跪姿，身体保持一条直线"},
      {n:"哑铃罗马尼亚硬拉",img:"a-db-rdl",r:"12 次",c:"膝盖微屈，屁股往后推，背不弓，感受大腿后侧"},
      {n:"平板支撑",img:"a-plank",r:"40 秒",c:"收紧腹部和臀部，不塌腰",sec:40}
    ]},
  B:{name:"训练 B",who:"hus",rounds:3,restMove:15,restRound:60,equip:"一对哑铃 + 瑜伽垫",
    warm:["开合跳 30 秒","徒手深蹲 10 个","手臂绕环 30 秒","原地高抬腿 30 秒"],
    cool:["大腿前侧、后侧拉伸各 20 秒","胸部拉伸 20 秒","猫牛式 5 次"],
    moves:[
      {n:"哑铃后撤步弓步蹲",img:"b-reverse-lunge",r:"每侧 10 次",c:"向后跨步下蹲，前腿膝盖不内扣"},
      {n:"哑铃站姿推举",img:"b-overhead-press",r:"10 次",c:"收紧核心，不要后仰借力"},
      {n:"哑铃臀桥",img:"b-db-glute-bridge",r:"15 次",c:"哑铃放髋部，顶到最高点夹紧臀部停 1 秒"},
      {n:"地板哑铃卧推",img:"b-floor-press",r:"12 次",c:"躺在垫子上推，手肘碰地即可"},
      {n:"死虫",img:"b-dead-bug",r:"每侧 10 次",c:"下背部始终贴地，对侧手脚同时伸展"}
    ]},
  W:{name:"臀腿跟练",who:"wife",rounds:2,restMove:15,restRound:45,equip:"一张瑜伽垫",
    warm:["原地踏步 30 秒","髋关节绕环每侧 10 次","徒手深蹲 8 个"],
    cool:["婴儿式 30 秒","髋部拉伸每侧 20 秒"],
    moves:[
      {n:"臀桥",img:"w-glute-bridge",r:"15 次",c:"双脚与髋同宽，顶起时夹紧臀部，停 1 秒再放下"},
      {n:"徒手深蹲",img:"w-bodyweight-squat",r:"12 次",c:"屁股往后坐，像坐椅子，膝盖不内扣"},
      {n:"侧卧抬腿",img:"w-side-leg-raise",r:"每侧 12 次",c:"身体侧躺成一条直线，上面的腿慢慢抬起放下"},
      {n:"蚌式开合",img:"w-clamshell",r:"每侧 15 次",c:"侧躺屈膝，双脚并拢，打开上侧膝盖"},
      {n:"后撤步弓步",img:"w-reverse-lunge",r:"每侧 8 次",c:"可以扶着墙或椅子保持平衡"},
      {n:"仰卧交替抬腿",img:"w-alt-leg-raise",r:"每侧 10 次",c:"下背部贴地，腹部收紧，慢慢放下"}
    ]},
  N:{name:"徒手全身训练",who:"both",rounds:2,restMove:15,restRound:45,equip:"无需器械，地面动作可垫毛巾",
    warm:["原地踏步 30 秒","手臂绕环 30 秒","徒手深蹲 8 个"],cool:["婴儿式 30 秒","髋部拉伸每侧 20 秒"],
    moves:[
      {n:"徒手深蹲",img:"w-bodyweight-squat",r:"12 次",c:"屁股往后坐，膝盖和脚尖同向"},
      {n:"俯卧撑",img:"a-push-up",r:"8–12 次",c:"可以跪姿，保持身体稳定"},
      {n:"臀桥",img:"w-glute-bridge",r:"15 次",c:"顶起时收紧臀部"},
      {n:"死虫",img:"b-dead-bug",r:"每侧 10 次",c:"下背部贴地，慢慢伸展对侧手脚"},
      {n:"平板支撑",img:"a-plank",r:"30 秒",c:"收紧腹部，不塌腰",sec:30}
    ]},
  C:{name:"快走 30 分钟",who:"both",rounds:1,restMove:0,restRound:0,equip:"一双舒服的鞋",warm:[],cool:[],
    moves:[{n:"快走",img:"warm-march",r:"30 分钟",c:"微微出汗、能说话但唱不了歌的速度；推着婴儿车散步也算",sec:1800}]},
  D:{name:"工位 3 分钟",who:"both",rounds:1,restMove:5,restRound:0,equip:"不需要装备",warm:[],cool:[],
    moves:[
      {n:"坐姿夹臀",img:"d-seated-glute-squeeze",r:"15 次",c:"收紧臀部保持 3 秒再放松"},
      {n:"坐姿收腹",img:"d-seated-brace",r:"15 次",c:"吸气时收紧腹部"},
      {n:"颈部侧拉伸",img:"d-neck-stretch",r:"左右各 15 秒",c:"动作要慢，不要用力拽",sec:30},
      {n:"站姿提踵",img:"d-calf-raise",r:"10 次",c:"起身，脚跟抬起再慢慢放下"},
      {n:"双手向上伸展",img:"d-overhead-reach",r:"15 秒",c:"双手交叉向上，拉长身体",sec:15}
    ]}
};
const workoutTitle=key=>key==="A"||key==="B"?"全身力量训练":WORKOUTS[key]?.name||"今天的训练";
const LIST_MOVE_MEDIA={
  "开合跳 30 秒":[["warm-jumping-jack","开合跳"]],
  "徒手深蹲 10 个":[["w-bodyweight-squat","徒手深蹲"]],
  "手臂绕环 30 秒":[["warm-arm-circle","手臂绕环"]],
  "原地高抬腿 30 秒":[["warm-high-knees","原地高抬腿"]],
  "原地踏步 30 秒":[["warm-march","原地踏步"]],
  "髋关节绕环每侧 10 次":[["warm-hip-circle","髋关节绕环"]],
  "徒手深蹲 8 个":[["w-bodyweight-squat","徒手深蹲"]],
  "大腿前侧、后侧拉伸各 20 秒":[["cool-quad-stretch","大腿前侧拉伸"],["cool-hamstring-stretch","大腿后侧拉伸"]],
  "胸部拉伸 20 秒":[["cool-chest-stretch","胸部拉伸"]],
  "猫牛式 5 次":[["cool-cat-cow","猫牛式"]],
  "婴儿式 30 秒":[["cool-child-pose","婴儿式"]],
  "髋部拉伸每侧 20 秒":[["cool-hip-stretch","髋部拉伸"]]
};
const EXTRA_MOVES=[...new Map(Object.values(WORKOUTS).flatMap(w=>w.moves).map(m=>[m.img,m])).values(),
  ...Object.values(LIST_MOVE_MEDIA).flat().filter(([id])=>!Object.values(WORKOUTS).some(w=>w.moves.some(m=>m.img===id))).map(([img,n])=>({img,n,r:"轻松做 30 秒",c:"缓慢活动，以舒适为准"}))];
const REST_SUGGESTIONS=["d-seated-glute-squeeze","d-overhead-reach","d-calf-raise"];
const MOVE_MEDIA_VERSION="media1";
const moveURL=(id,full=false)=>`assets/moves/${id}${full?"":"-small"}.webp?v=${MOVE_MEDIA_VERSION}`;
function moveArt(id,alt,{full=false,loading="lazy",className="",width=320,height=240}={}){
  return `<picture class="move-art"><source type="image/webp" srcset="${moveURL(id,full)}"><img src="assets/moves/${id}.gif" alt="${esc(alt)}动作示意" decoding="async" loading="${loading}" fetchpriority="${full?"high":"auto"}" width="${width}" height="${height}"${className?` class="${className}"`:""}></picture>`;
}
let extraMoveQuery="";
const extraDone=c=>Array.isArray(c.extraMoves)?c.extraMoves.filter(id=>EXTRA_MOVES.some(m=>m.img===id)):[];
function toggleExtraMove(c,id){
  if(!EXTRA_MOVES.some(m=>m.img===id))return c;
  const done=extraDone(c);
  return {...c,extraMoves:done.includes(id)?done.filter(x=>x!==id):[...done,id]};
}
function recoveryRest(c){
  const state=c.dailyState||"";
  const week=privateCoach?.active?privateCoach.ownWeek?.()||{}:{};
  const health=privateCoach?.active?(Array.isArray(week.bodyStatus)?week.bodyStatus:privateCoach.profile?.health||[]):[];
  const note=Array.isArray(week.bodyStatus)?week.bodyNote||"":privateCoach?.profile?.notes?.[1]||"";
  return /疼痛|生病|经期不适|很疲惫/.test(state)||health.some(x=>x!=="目前无特别不适"&&x!=="暂时没有"&&/疼痛|生病|恢复|不适|疲惫|慢性病/.test(x))||/疼|痛|病|伤|不适/.test(note);
}
function extraMoveRows(c,query=extraMoveQuery){
  const q=query.trim().toLowerCase(), done=extraDone(c);
  if(!q&&recoveryRest(c)&&!done.length)return `<div class="extra-empty">今天先休息。若已经做了动作，可以在上方搜索并记录。</div>`;
  const list=q?EXTRA_MOVES.filter(m=>m.n.toLowerCase().includes(q)||m.c.toLowerCase().includes(q)):
    [...(recoveryRest(c)?[]:REST_SUGGESTIONS.map(id=>EXTRA_MOVES.find(m=>m.img===id)).filter(Boolean)),...done.map(id=>EXTRA_MOVES.find(m=>m.img===id)).filter(m=>m&&(recoveryRest(c)||!REST_SUGGESTIONS.includes(m.img)))];
  return list.length?list.map(m=>`<button type="button" class="extra-move" data-extra-move="${m.img}" aria-pressed="${done.includes(m.img)}">${moveArt(m.img,m.n,{width:72,height:54})}<span><b>${esc(m.n)}</b><small>${esc(m.r)} · ${esc(m.c)}</small></span><em>${done.includes(m.img)?"已打卡":"打卡"}</em></button>`).join(""):
    `<div class="extra-empty">没有找到这个动作，试试“深蹲”“拉伸”或“臀桥”</div>`;
}
const WEEK = ["日","一","二","三","四","五","六"];

/* ---------- date helpers ---------- */
const pad = n => String(n).padStart(2,"0");
const ymd = d => d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
const addDays = (d,n) => { const x=new Date(d); x.setDate(x.getDate()+n); return x; };
function isoWeek(d){
  const t=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));
  const day=t.getUTCDay()||7; t.setUTCDate(t.getUTCDate()+4-day);
  const y0=new Date(Date.UTC(t.getUTCFullYear(),0,1));
  return Math.ceil(((t-y0)/864e5+1)/7);
}
/* what does each person do on a given day */
function scheduleFor(person,d){
  if(privateCoach?.active && person===me){
    const baseSchedule=legacyScheduleFor(person,d);
    return privateCoach.schedule(ymd(d),baseSchedule);
  }
  return legacyScheduleFor(person,d);
}
function legacyScheduleFor(person,d){
  const w=d.getDay(); const even=isoWeek(d)%2===0;
  if(w===4){ const g=goalOf(person); if(g&&g.cardio) return {kind:"flex",w:"C"}; }
  if(person==="hus"){
    if(w===1||w===5) return {kind:"train",w:even?"A":"B"};
    if(w===3) return {kind:"train",w:even?"B":"A"};
    if(w===6) return {kind:"flex",w:even?"B":"A"};
    return {kind:"rest"};
  }
  if(w===1||w===3) return {kind:"train",w:"W"};
  if(w===5||w===6) return {kind:"flex",w:"W"};
  return {kind:"rest"};
}

/* ---------- state ---------- */
const LS_ME="fatloss.me"; let LS_DATA="fatloss.local";
const storedMe = (()=>{ try{ return localStorage.getItem(LS_ME); }catch(e){ return null; } })();
let me = storedMe==="wife" ? "wife" : "hus";
let viewP = me; // whose plan is shown in 饮食 / 训练
let tab = "today";
const LS_FAMILY="fatloss.family"; let LS_DIRTY="fatloss.dirty";
const CLOUD = !!(SUPABASE_URL && SUPABASE_KEY);
let privateCoach=null, coachReady=Promise.resolve();
let startupPending=false, startupSyncReason=null;
function finishStartup(home=false){
  if(!startupPending)return;
  startupPending=false;
  if(home){lastTab=null;render();}
  document.body.classList.remove("booting");
  $("#appShell").inert=false;$("#appTabs").inert=false;
  const reason=startupSyncReason;startupSyncReason=null;
  if(reason)setTimeout(()=>sync(reason),500);
  // Worker installation fetches the app shell; keep it out of the entry animation.
  window.duoEntry?.complete();
}
let family = (()=>{ try{ return localStorage.getItem(LS_FAMILY)||""; }catch(e){ return ""; } })();
/* 旧邀请链接曾把口令放在 URL 中；清掉片段，不再自动保存口令。 */
if(/^#k=/.test(location.hash)) history.replaceState(null,"",location.pathname+location.search);
let store = { checkins:{}, measures:{} };
try{ const raw=localStorage.getItem(LS_DATA); if(raw){ const p=JSON.parse(raw); store.checkins=p.checkins||{}; store.measures=p.measures||{}; } }catch(e){}
let dirty = (()=>{ try{ return JSON.parse(localStorage.getItem(LS_DIRTY)||"[]"); }catch(e){ return []; } })(); // ["c:<id>","m:<id>"]
let syncState = CLOUD ? (family ? "idle" : "nocode") : "local"; // local | nocode | idle | syncing | ok | offline | error
let lastSync = null;

function saveLocal(){ try{ localStorage.setItem(LS_DATA,JSON.stringify(store)); localStorage.setItem(LS_DIRTY,JSON.stringify(dirty)); }catch(e){} }
function markDirty(key){ if(!dirty.includes(key)) dirty.push(key); }
function ackDirty(key,sent){
  const id=key.slice(2),body=key[0]==="c"?store.checkins[id]:store.measures[id];
  if(JSON.stringify(body)!==sent)return false;
  dirty=dirty.filter(k=>k!==key);saveLocal();return true;
}

async function rpc(fn,args){
  const headers={"Content-Type":"application/json","apikey":SUPABASE_KEY};
  if(!SUPABASE_KEY.startsWith("sb_")) headers["Authorization"]="Bearer "+SUPABASE_KEY;
  const ctl=new AbortController(); const t=setTimeout(()=>ctl.abort(),12000);
  try{
    const r=await fetch(SUPABASE_URL.replace(/\/$/,"")+"/rest/v1/rpc/"+fn,{method:"POST",headers,body:JSON.stringify(args),signal:ctl.signal});
    if(!r.ok){ const e=new Error("http "+r.status); e.status=r.status; e.text=await r.text().catch(()=> ""); throw e; }
    const txt=await r.text(); return txt?JSON.parse(txt):null;
  } finally { clearTimeout(t); }
}

let syncing=false, syncAgain=false;
async function sync(reason="change"){
  if(startupPending){startupSyncReason=reason;return;}
  if(privateCoach)return privateCoach.sync(store,dirty,reason);
  if(!CLOUD || !family) return;
  if(syncing){ syncAgain=true; return; }
  syncing=true; syncState="syncing"; renderSync();
  try{
    // 1. push local changes
    const pending=dirty.slice();
    for(const key of pending){
      const [kind,id]=[key.slice(0,1),key.slice(2)];
      const body = kind==="c" ? store.checkins[id] : store.measures[id];
      if(body) await rpc(kind==="c"?"fl_put_checkin":"fl_put_measure",{p_family:family,p_id:id,p_person:body.person,p_date:body.date,p_body:body});
      dirty=dirty.filter(k=>k!==key); saveLocal();
    }
    // 2. pull everything for this family
    const since=ymd(addDays(new Date(),-120));
    const data=await rpc("fl_pull",{p_family:family,p_since:since});
    const nextC={}, nextM={};
    (data&&data.checkins||[]).forEach(r=>{ nextC[r.id]=r.body; });
    (data&&data.measures||[]).forEach(r=>{ nextM[r.id]=r.body; });
    dirty.forEach(k=>{ const id=k.slice(2); if(k[0]==="c"&&store.checkins[id]) nextC[id]=store.checkins[id]; if(k[0]==="m"&&store.measures[id]) nextM[id]=store.measures[id]; });
    store.checkins=nextC; store.measures=nextM; saveLocal();
    syncState="ok"; lastSync=new Date();
  }catch(e){
    syncState = (e && e.status) ? "error" : "offline";
    if(e && e.status) console.warn("sync error",e.status,e.text);
  }finally{
    syncing=false; render();
    if(syncAgain){ syncAgain=false; setTimeout(sync,300); }
  }
}
let pushTimer=null;
function schedulePush(delay){ clearTimeout(pushTimer); pushTimer=setTimeout(()=>sync("change"),delay||400); }

function checkinId(person,date){ return person+"_"+date; }
function getCheckin(person,date){
  return store.checkins[checkinId(person,date)] || {person,date,meals:{},workout:null,stand:0};
}
function putCheckin(body,delay){
  const id=checkinId(body.person,body.date);
  body.updatedAt=Date.now(); store.checkins[id]=body; markDirty("c:"+id); saveLocal(); render();
  schedulePush(delay);
}
function putMeasure(body){
  const id=body.person+"_"+body.date;
  store.measures[id]=body; markDirty("m:"+id); saveLocal(); render();
  schedulePush(0);
}
const readOnly=false;

/* ---------- completeness & streak ---------- */
function dayDone(person,d){
  if(privateCoach?.active && person!==me) return privateCoach.partnerChecked(ymd(d));
  const c=getCheckin(person,ymd(d));
  const meals=MEALS.every(m=>c.meals && c.meals[m]);
  const s=scheduleFor(person,d);
  return meals && (s.kind!=="train" || c.workout==="done");
}
function streak(person){
  const today=new Date(); let n=0; let d=today;
  if(!dayDone(person,d)) d=addDays(d,-1);
  for(let i=0;i<365;i++){ if(dayDone(person,d)){ n++; d=addDays(d,-1);} else break; }
  return n;
}

/* ---------- render ---------- */
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

// iOS can composite scrolling content beneath its status bar while painting a
// fallback until scrolling clears its native inset. The affected phone reports
// screen=932, viewport=873, safeTop=0; 1px failed, a manual 72px scroll revealed the scene.
let heroScrollStartReady=false,heroScrollTouch=false,heroScrollTimer=null;
const heroViewportTrace={attempts:0,lastBlocked:null,firstApplied:null,firstUserScroll:null};
function pageViewportSnapshot(){
  const root=document.documentElement,hero=document.querySelector('#pageHero');
  const probe=document.createElement('div');
  probe.style.cssText='position:absolute;visibility:hidden;pointer-events:none;width:0;height:0;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)';
  document.body.appendChild(probe);
  const safeStyle=getComputedStyle(probe),safeTop=safeStyle.paddingTop,safeBottom=safeStyle.paddingBottom;
  probe.remove();
  const vv=window.visualViewport,rect=hero?.getBoundingClientRect();
  return {page:tab,scrollY:window.scrollY,innerWidth:window.innerWidth,innerHeight:window.innerHeight,
    screenWidth:window.screen.width,screenHeight:window.screen.height,clientHeight:root.clientHeight,
    visualViewport:vv?{height:vv.height,offsetTop:vv.offsetTop,pageTop:vv.pageTop,scale:vv.scale}:null,
    safeTop,safeBottom,heroTop:rect?.top??null,heroHeight:rect?.height??null,
    bodyOverflow:getComputedStyle(document.body).overflowY,visibility:document.visibilityState};
}
function heroScrollStartOffset(){
  if(!heroScrollStartReady)return 0;
  return window.duoNativeStartOffset();
}
function pageViewportDiagnostics(){
  return {version:60,userAgent:navigator.userAgent,standalone:navigator.standalone===true,
    startup:window.duoBootTrace?{version:window.duoBootTrace.version,workerVersion:window.duoBootTrace.workerVersion,reducedMotion:window.duoBootTrace.reducedMotion,events:window.duoBootTrace.events,paint:performance.getEntriesByName('first-contentful-paint')[0]?.startTime||null,workerControlled:!!navigator.serviceWorker?.controller}:null,
    displayStandalone:matchMedia('(display-mode: standalone)').matches,
    canvas:document.documentElement.classList.contains("app-entry-active")?"entry":"page",entryLayer:{position:getComputedStyle($("#pick")).position,open:$("#pick").classList.contains("open")},earlyStart:window.duoBootViewport||null,scrollStartEnabled:heroScrollStartReady,targetScrollY:heroScrollStartOffset(),current:pageViewportSnapshot(),trace:heroViewportTrace};
}
function prepareHeroScrollStart(){
  if(heroScrollStartReady)return;
  const ios=/(?:iPhone|iPad|iPod)/.test(navigator.userAgent);
  if(!ios||!(navigator.standalone===true||matchMedia("(display-mode: standalone)").matches))return;
  heroScrollStartReady=true;
  const settle=()=>{clearTimeout(heroScrollTimer);heroScrollTimer=setTimeout(restoreHeroScrollStart,180);};
  window.addEventListener("scroll",settle,{passive:true});
  window.addEventListener("scrollend",restoreHeroScrollStart,{passive:true});
  window.addEventListener("touchstart",()=>{heroScrollTouch=true;},{passive:true});
  window.addEventListener("touchend",()=>{heroScrollTouch=false;if(!heroViewportTrace.firstUserScroll&&window.scrollY>heroScrollStartOffset())heroViewportTrace.firstUserScroll=pageViewportSnapshot();settle();},{passive:true});
  window.addEventListener("touchcancel",()=>{heroScrollTouch=false;settle();},{passive:true});
  window.addEventListener("pageshow",restoreHeroScrollStart);
  window.addEventListener("resize",settle,{passive:true});
  document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")restoreHeroScrollStart();});
}
function restoreHeroScrollStart(){
  if(!heroScrollStartReady)return;
  requestAnimationFrame(()=>{
    // Do not interrupt reading, a drag/bounce, keyboard input or any modal.
    const target=heroScrollStartOffset();
    document.documentElement.style.setProperty("--ds-native-top-inset",Math.max(0,target-1)+"px");
    if(!target)return;
    heroViewportTrace.attempts++;
    const blocked=heroScrollTouch?'touch':window.scrollY<0?'overscroll':window.scrollY>=target?'already-scrolled':
      document.visibilityState!=="visible"?'hidden':document.querySelector('.pick.open,.run.open,#duoCoach:not([hidden])')?'dialog':
      getComputedStyle(document.body).overflowY==="hidden"?'overflow-hidden':
      /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName||"")?'input':null;
    if(blocked){heroViewportTrace.lastBlocked=blocked;return;}
    window.scrollTo({top:target,left:0,behavior:"instant"});
    requestAnimationFrame(()=>{if(!heroViewportTrace.firstApplied)heroViewportTrace.firstApplied=pageViewportSnapshot();});
  });
}
function scrollToPageStart(){
  const target=heroScrollStartOffset();
  document.documentElement.style.setProperty("--ds-native-top-inset",Math.max(0,target-1)+"px");
  window.scrollTo({top:target,left:0,behavior:"instant"});
  if(heroScrollStartReady)requestAnimationFrame(()=>{if(!heroViewportTrace.firstApplied)heroViewportTrace.firstApplied=pageViewportSnapshot();});
}
function renderHeader(){
  prepareHeroScrollStart();
  const d=new Date();
  $("#pageTitle").textContent={today:"今日",diet:"饮食",train:"训练",record:"记录"}[tab];
  $("#pageHero").dataset.page=tab;
  const hand={today:["把今天","过好就很棒"],diet:["好好吃饭","慢慢记下来"],train:scheduleFor(me,d).kind==="rest"?["休息，","也是计划的一部分"]:["照着计划，","一点点动起来"],record:["每一次记录","都在靠近自己"]}[tab];
  $("#heroHandA").textContent=hand[0]; $("#heroHandB").textContent=hand[1];
  $("#dateLabel").textContent=`${d.getMonth()+1}月${d.getDate()}日 周${WEEK[d.getDay()]}`;
  $("#roleBtn").hidden=!!privateCoach;
  $("#roleBtn").setAttribute("aria-label","切换身份，当前是"+PEOPLE[me].label);
  document.documentElement.classList.toggle("app-hero-active",!document.documentElement.classList.contains("app-entry-active"));
  document.documentElement.classList.toggle("me-hus",me==="hus");
  document.documentElement.classList.toggle("me-wife",me==="wife");
  document.body.className="me-"+me;
  // Mirror the active scene onto the root canvas that iOS exposes behind its status area.
  document.documentElement.style.setProperty("--ds-root-hero-image",getComputedStyle($("#pageHero")).backgroundImage);
  const topColors=getComputedStyle(document.documentElement);
  const lightMeta=document.querySelector('meta[name="theme-color"][media*="light"]');
  const darkMeta=document.querySelector('meta[name="theme-color"][media*="dark"]');
  if(lightMeta)lightMeta.content=topColors.getPropertyValue('--app-top-light').trim();
  if(darkMeta)darkMeta.content=topColors.getPropertyValue('--app-top-dark').trim();
  restoreHeroScrollStart();
}
function renderSync(){
  const el=$("#sync"); let t="", detail="", warn=false;
  const hm=d=>d.getHours()+":"+pad(d.getMinutes());
  switch(syncState){
    case "local": t="仅保存在本机"; detail="数据只保存在这台手机上（没读到 config.js 里的 Supabase 配置）"; warn=true; break;
    case "nocode": t="尚未设置同步"; detail="还没设置家庭口令，暂时不会同步"; warn=true; break;
    case "syncing": t="正在同步…"; break;
    case "pending": t="记录待同步"; detail="记录已保存，正在继续上传…"; break;
    case "ok": t=lastSync?"已同步 · "+hm(lastSync):""; break;
    case "offline": t="离线 · 稍后重试"; detail="暂时连不上云端，记录已保存在本机，会自动重试"; warn=true; break;
    case "error": t="同步未完成"; detail="云端同步未完成，记录已保存在本机；可在设置里复制连接诊断"; warn=true; break;
    case "auth": t="需要重新连接"; detail="本机身份需要重新连接，记录仍保存在本机"; warn=true; break;
    default: t="";
  }
  if(dirty.length && syncState!=="syncing" && syncState!=="local")t=`待同步 · ${dirty.length} 条`;
  $("#syncText").textContent=t;
  $("#syncIcon").hidden=!(syncState==="ok"&&!!lastSync&&!dirty.length);
  el.classList.toggle("warn",warn);
  el.title=detail||t;
  el.setAttribute("aria-label",detail||t||"同步状态暂不可用");
}

function beadsFor(person){
  const today=new Date(); const date=ymd(today); const c=getCheckin(person,date);
  const s=scheduleFor(person,today);
  const labels={breakfast:"早",lunch:"午",snack:"加",dinner:"晚"};
  const names={breakfast:"早餐",lunch:"午餐",snack:"加餐",dinner:"晚餐"};
  let html=MEALS.map(m=>{
    const v=c.meals&&c.meals[m];
    const [cls,txt,st]=v==="plan"?["on",icon("check","sm"),"按计划"]:v==="over"?["over",icon("check","sm"),"吃多了"]:v==="skip"?["skip","–","没吃"]:["",labels[m],"未打卡"];
    return `<span class="bead ${cls}" title="${names[m]}：${st}">${txt}</span>`;
  }).join("");
  const done=c.workout==="done";
  html+= s.kind==="rest" ? `<span class="bead rest" title="今天休息">休</span>`
    : `<span class="bead ${done?"on":""}" title="训练：${done?"已完成":"未完成"}">${done?icon("check","sm"):"练"}</span>`;
  return html;
}
/* 今天两人一共需要打卡几项、完成了几项 */
function todayProgress(){
  const d=new Date(); let need=0, got=0;
  ["hus","wife"].forEach(p=>{ const c=getCheckin(p,ymd(d)); const s=scheduleFor(p,d);
    MEALS.forEach(m=>{ need++; if(c.meals&&c.meals[m]) got++; });
    if(s.kind==="train"){ need++; if(c.workout==="done") got++; } });
  return [got,need];
}
/* 两个人都完成的连续天数 */
function bothStreak(){
  let n=0; let d=new Date();
  if(!(dayDone("hus",d)&&dayDone("wife",d))) d=addDays(d,-1);
  for(let i=0;i<365;i++){ if(dayDone("hus",d)&&dayDone("wife",d)){ n++; d=addDays(d,-1);} else break; }
  return n;
}
const MEAL_IC={breakfast:"breakfast",lunch:"lunch",snack:"snack",dinner:"dinner"};
/* 表情：workout 运动中 · meal 按计划吃 · weigh 记录身体数据 · happy 开心 · sad 没有数据 · day-done 今天全部完成 · day-missed 回顾昨天没完成 */
const mood=(person,state)=>`assets/mood/${person}-${state}.webp?v=media1`;
let reactT=null;
function react(state,title,sub,big){
  const el=$("#react"); el.className="react"+(big?" big":"");
  el.innerHTML=`<img src="${mood(me,state)}" alt=""><div><b>${esc(title)}</b>${sub?`<small>${esc(sub)}</small>`:""}</div>`;
  requestAnimationFrame(()=>el.classList.add("show"));
  clearTimeout(reactT); reactT=setTimeout(()=>el.classList.remove("show"), big?2600:2000);
}
/* 昨天的计划还差几项（只在最近一周有打卡时提醒，避免新用户被打扰） */
function yesterdayMissing(person){
  const y=addDays(new Date(),-1); if(dayDone(person,y)) return 0;
  const recent=[1,2,3,4,5,6,7].some(n=>{ const c=store.checkins[person+"_"+ymd(addDays(new Date(),-n))]; return c && ((c.meals&&Object.keys(c.meals).length)||c.workout); });
  if(!recent) return 0;
  const c=getCheckin(person,ymd(y)); const s=scheduleFor(person,y);
  return MEALS.filter(m=>!(c.meals&&c.meals[m])).length + (s.kind==="train"&&c.workout!=="done"?1:0);
}
const secH=(symbol,title,right)=>`<div class="sec-h"><h3><i class="si i-${symbol}" aria-hidden="true">${icon(symbol)}</i>${title}</h3>${right?`<span>${right}</span>`:""}</div>`;

function viewToday(){
  const today=new Date(); const date=ymd(today);
  const c=getCheckin(me,date); const s=scheduleFor(me,today); const plan=MEAL_PLAN[me];
  const hasDietRule=!!(privateCoach?.active&&(privateCoach.profile?.diet?.trim()||/不吃|不能吃|过敏|忌口|乳糖|素食/.test(privateCoach.profile?.notes?.[2]||"")));
  const bs=privateCoach?.active ? 0 : bothStreak(); const [got,need]=privateCoach?.active ? [0,0] : todayProgress();
  const together=`<div class="together"><span class="fire">${icon("flame")}</span>
    <span class="t">${bs?`并肩打卡<b class="num">${bs}</b>天`:"今天一起把打卡填满吧"}</span>
    <span class="chip ${got===need?"good":""}">今天 ${got}/${need}</span></div>`;
  const focus=privateCoach?.profile?.focus?.filter(Boolean).join('、')||'查看计划';
  const dailyStatus=s.kind==='rest'?'安心休息':c.dailyChoice==='short'?'短版训练':'照常训练';
  const summary=privateCoach?.active?`<section class="today-summary-pair ${me}" aria-label="本周方向和每日状态">
    <button type="button" data-coach="weekly" aria-label="本周方向：${esc(focus)}；查看或调整本周计划"><span class="summary-icon">${icon('goal')}</span><span class="summary-copy"><small>本周方向</small><strong>${esc(focus)}</strong></span>${icon('chevron-right','sm')}</button>
    <button type="button" data-coach="daily" aria-label="每日状态：${dailyStatus}；查看或调整今天"><span class="summary-icon">${icon('smile')}</span><span class="summary-copy"><small>每日状态</small><strong>${dailyStatus}</strong></span>${icon('chevron-right','sm')}</button>
  </section>`:'';
  let trainCard;
  if(s.kind==="rest"){
    const recovering=recoveryRest(c), count=extraDone(c).length;
    const preview=recovering?[]:REST_SUGGESTIONS.map(id=>EXTRA_MOVES.find(m=>m.img===id)).filter(Boolean);
    trainCard=`<div class="obs"><span class="tag2">${icon("leaf","sm")} 今天休息</span><h4>${recovering?"今天先照顾身体":"休息日也可以轻轻动一动"}</h4><p>${recovering?"今天不安排训练。已经做过的动作仍可以自行记录。":"可选小活动不影响休息日安排；做了哪项就记哪项。"}</p>
      ${preview.length?`<div class="today-move-preview">${preview.map(m=>`<div class="item">${moveArt(m.img,m.n)}<b>${esc(m.n)}</b></div>`).join("")}</div>`:""}
      <button class="cta" data-open-extra>${icon("train","sm")} ${count?`已记录 ${count} 项 · 查看动作`:"查看可选动作并打卡"}</button></div>`;
  }else{
    const w=WORKOUTS[s.w]; const done=c.workout==="done";
    const sub = s.w==="C" ? "可选：推着婴儿车散步也算" : s.kind==="flex" ? "可选：宝宝午睡时或者轮流带娃时练" : `${roundsFor(s.w,me)} 轮，大约 ${Math.round((me==="hus"?20:15)*roundsFor(s.w,me)/w.rounds)} 分钟 · ${w.equip}`;
    trainCard=`<div class="obs"><span class="tag2">${icon(s.kind==="flex"?"cloud":"train","sm")} ${s.kind==="flex"?"今天可选":"今天训练"} · ${PEOPLE[me].label}</span>
      <h4>${workoutTitle(s.w)}</h4><p>${sub}</p>
      <div class="today-move-preview">${w.moves.slice(0,3).map(m=>`<div class="item">${moveArt(m.img,m.n)}<b>${esc(m.n)}</b></div>`).join("")}</div>
      ${done?`<button class="cta done" data-undo-workout>${icon("check","sm")} 今天已完成</button>`:`<button class="cta" data-start="${s.w}">${icon("play","sm")} 开始训练</button>`}</div>`;
  }

  const meals=MEALS.map(m=>{
    const v=c.meals?.[m],p=plan[m],fd=v==='skip'?null:c.food?.[m];
    return `<article class="card meal ${me}" data-meal-status="${v||''}">
      ${mealHeading(m,p.t,p.time,mealKcal(me,m),"today")}
      <div class="meal-body"><div class="meal-plan-range"><span>计划</span>${mealEnergy(mealKcal(me,m))}</div>${mealPlanContent(me,m,hasDietRule)}
      ${fd?`<div class="meal-actual"><div class="meal-actual-top"><span>实际记录</span>${mealEnergy(fd.kcal)}<button type="button" class="meal-edit" data-food="${m}" aria-label="修改${p.t}食物">修改${icon('chevron-right','sm')}</button></div><p class="meal-food-text">${esc(mealRecordText(c,m))}</p></div>`
        :`<button class="logbtn" data-food="${m}">${icon('note','sm')} ${v==='skip'?'这餐没吃 · 重新记食物':'记食物，估算热量'}${icon('chevron-right','sm')}</button>`}
      ${mealActions(m,v,p.t)}</div></article>`;
  }).join('');

  const overCount=MEALS.filter(m=>c.meals&&c.meals[m]==="over").length;
  const overNote= overCount ? `<p class="note" style="margin-top:10px">吃多了没关系，下一顿正常吃就好，不用饿肚子补回来。</p>` : "";

  const todayAny = (c.meals&&Object.keys(c.meals).length) || c.workout;
  const miss = todayAny ? 0 : yesterdayMissing(me);
  const missed = miss ? `<div class="missed"><img src="${mood(me,"day-missed")}" alt=""><div><b>昨天还差 ${miss} 项没打卡</b><small>没关系，今天重新开始就好。先把早餐打个卡吧</small></div></div>` : "";
  const gp=planFor(me);
  const goalTop = privateCoach?.active ? summary : gp ? suggCard() : `<div class="goal-cta"><img src="${mood(me,"weigh")}" alt=""><div><b>设定你的目标</b><small>按你的体重安排每天吃多少、怎么练</small></div><button class="btn primary" data-open-goal>去设定</button></div>`;
  $("#view").innerHTML = missed + goalTop + (privateCoach?.active ? '' : together) + `
    ${moduleCard("工位起身",`<div class="counter"><div class="txt"><h4>起来动一动</h4><p>每坐 1 小时起身 2–3 分钟</p></div><div class="ctl"><button data-stand="-1" aria-label="减一次">−</button><b>${c.stand||0}<small>/6 次</small></b><button data-stand="1" aria-label="加一次">+</button></div></div>`,{id:'standModule',meta:'给久坐的身体一个小休息',art:'workout'})}
    <section class="sec ds-scene ds-meal-scene ${me}">${mealSectionHeading("今天吃什么",date,"today",me)}
      <div class="stack">${meals}</div>${overNote}</section>
    <section class="sec">${trainCard}</section>`;
}

// Shared compact module shell. Body renderers own data; this helper owns presentation.
function moduleCard(title,body,{id='',person=me,meta='',art='',symbol=''}={}){
  return `<section class="sec ds-scene ds-module ${person}"${id?` id="${id}"`:''}><header class="ds-module-heading"><div><h3>${esc(title)}</h3>${meta?`<p>${esc(meta)}</p>`:''}</div>${art?`<img class="ds-module-art" src="${mood(person,art)}" width="88" height="88" alt="" loading="lazy" decoding="async">`:symbol?`<span class="ds-module-mark" aria-hidden="true">${icon(symbol,'lg')}</span>`:''}</header><div class="ds-module-body">${body}</div></section>`;
}

function peekSwitch(){
  if(privateCoach?.active) return "";
  const b=p=>`<button class="${p}" data-view="${p}" aria-pressed="${viewP===p}">${PEOPLE[p].label}的计划${p===me?"（我）":""}</button>`;
  return `<div class="peek" role="group" aria-label="看谁的计划">${b("hus")}${b("wife")}</div>`+
    (viewP!==me?`<p class="peek-note">正在看对方的计划，打卡和训练仍按你自己的身份记录。</p>`:"");
}
/* 按今天打卡估算吃了多少：按计划 → 这顿的区间；吃多了 → 按这顿的上限；没吃 → 0 */
function eatenToday(person){
  const c=getCheckin(person,ymd(new Date())); let lo=0, hi=0, n=0;
  MEALS.forEach(m=>{ const v=c.meals&&c.meals[m]; if(!v) return; n++;
    const fd=c.food&&c.food[m];
    if(fd && v!=="skip"){ lo+=fd.kcal; hi+=fd.kcal; return; }  // 记了实际吃的，就用实际热量
    const r=mealRange(menuFor(person)[m]);
    if(v==="plan"){ lo+=r[0]; hi+=r[1]; } else if(v==="over"){ lo+=r[1]; hi+=r[1]; } });
  return {lo,hi,n,c};
}
const MEAL_NAMES={breakfast:"早餐",lunch:"午餐",snack:"加餐",dinner:"晚餐"};
const MEAL_STATES={plan:["plan","按计划"],over:["over","吃多了"],skip:["skip","没吃"]};
const mealCount=c=>MEALS.filter(m=>MEAL_STATES[c.meals?.[m]]).length;
function mealRecordText(c,m){
  const v=c.meals?.[m],fd=c.food?.[m];
  if(v==="skip")return "这餐没有进食";
  if(!v)return "还没有留下这餐的记录";
  if(fd&&Array.isArray(fd.items)&&fd.items.length)return fd.items.map(i=>i.n+(i.q?" "+i.q:"")).join("、");
  return v==="plan"?"按计划记录了这餐":v==="over"?"已记录，下一顿照常吃就好":"还没有留下这餐的记录";
}
// Meal presentation is shared by Today, Diet plans and saved diary/history.
// Values are escaped here; historical calories come only from the saved record.
function mealEnergy(value,label='约'){
  const number=typeof value==='number'?(Number.isFinite(value)?Math.round(value):null):value;
  return number==null?'':`<span class="meal-energy"><small>${label}</small><b>${esc(number)}</b><small>kcal</small></span>`;
}
function mealArt(m){
  return `<span class="meal-art-stage"><img class="meal-art" src="assets/meal-art/${m}${['breakfast','lunch'].includes(m)?'-detail-v1.webp?v=detail1':'-v1.webp?v=meal1'}" width="106" height="72" alt="" loading="lazy" decoding="async"></span>`;
}
function mealHeading(m,title,time,range,layout='plan'){
  return `<div class="meal-heading">${layout==='today'?`<span class="meal-symbol m-${m}" aria-hidden="true">${icon(MEAL_IC[m])}</span>`:mealArt(m)}<div class="meal-title"><h4>${esc(title)}</h4><time>${esc(time)}</time></div>${layout==='today'?mealArt(m):mealEnergy(range)}</div>`;
}
function mealSectionHeading(title,date,kind,person=me){
  const d=new Date(date+'T12:00:00');
  const label=`${d.getMonth()+1}月${d.getDate()}日 周${WEEK[d.getDay()]}`;
  return `<div class="meal-section-heading ds-section-heading ${person}"><div><h3>${esc(title)}</h3><time datetime="${esc(date)}">${label}</time></div>${window.DuoFitMascots.render(kind,person)}</div>`;
}
const recordSectionHeading=()=>`<div class="meal-section-heading ds-section-heading is-compact ${me}"><div><h3>我们的记录</h3></div></div>`;
function mealPlanContent(person,m,hasDietRule){
  const swap=privateCoach?.active?privateCoach.mealSwap(m):'';
  if(swap||hasDietRule)return `<div class="mplan-suggestion">${swap?'':'<span>餐食待确认</span>'}<p>${esc(swap||'已记录饮食限制，个性餐食暂未生成；请勿照搬默认菜品。')}</p></div>`;
  const f=menuFor(person)[m];
  return `<div class="meal-default"><ul class="foods">${f.items.map(i=>`<li><span>${esc(i.n)}<small>${esc(i.q)}${i.or?` · 或${esc(i.or.n)} ${kcalText(i.or.k)}`:''}</small></span><b>${kcalText(i.k)}</b></li>`).join('')}</ul>${f.pick1?'<p class="foods-note">三样里选一样</p>':''}${f.alt?`<p class="foods-note">${esc(f.alt.n)}（约 ${kcalText(f.alt.k)} kcal），就不再吃别的</p>`:''}</div>`;
}
function mealActions(m,v,title,date=''){
  return `<div class="seg diary-actions ds-checkin" role="group" aria-label="${title}打卡">${Object.entries(MEAL_STATES).map(([key,[,label]])=>`<button type="button" data-meal="${m}" data-v="${key}"${date?` data-meal-date="${date}"`:''} aria-label="${title}：${key==='plan'?'按计划吃了':label}" aria-pressed="${v===key}">${v===key?icon('check','sm'):''}${label}</button>`).join('')}</div>`;
}
const mealEditFloor=()=>ymd(addDays(new Date(),-119));
const canEditMealDate=(person,date)=>person===me&&/^\d{4}-\d{2}-\d{2}$/.test(date)&&date>=mealEditFloor()&&date<=ymd(new Date());
function dietDayRows(person,date,interactive=false,record=null){
  const c=record||getCheckin(person,date),canEdit=interactive&&canEditMealDate(person,date);
  return `<div class="diary-meals ${person}">${MEALS.map(m=>{const v=c.meals?.[m],st=MEAL_STATES[v]||['empty','未打卡'],fd=v&&v!=='skip'?c.food?.[m]:null;
    const kcal=Number.isFinite(fd?.kcal)?mealEnergy(fd.kcal):'';
    return `<article class="diary-meal" data-meal-status="${st[0]}"><div class="diary-meal-head"><span class="meal-symbol m-${m}" aria-hidden="true">${icon(MEAL_IC[m])}</span><div><h4>${MEAL_NAMES[m]}</h4><span class="meal-status ${st[0]}" aria-label="${date} ${MEAL_NAMES[m]}：${st[1]}">${st[1]}</span></div>${kcal}</div>
      <p class="diary-food ${v?'':'empty'}">${esc(mealRecordText(c,m))}</p>
      ${canEdit?`<button type="button" class="diary-edit" data-food="${m}" data-food-date="${date}" aria-label="${v?fd?'修改':'记录':'补打卡'}${date}${MEAL_NAMES[m]}${v?'食物':''}">${icon('note','sm')}${v?fd?'修改食物':'记食物，估算热量':'补打卡'}${icon('chevron-right','sm')}</button>${v?mealActions(m,v,MEAL_NAMES[m],date):''}`:''}</article>`;
  }).join('')}</div>`;
}

function ringCard(person){
  const e=eatenToday(person),day=dayRange(person),mid=Math.round((e.lo+e.hi)/2),pct=Math.min(1,mid/((day[0]+day[1])/2));
  return `<div class="nutrition-summary ${person}"><div class="nutrition-top"><span>今日热量估算</span><span class="nutrition-count">${e.n} / 4 餐已记录</span></div>
    <div class="nutrition-value"><div><b>${e.n?kcalText([e.lo,e.hi]):"—"}</b><small>kcal</small></div></div>
    <div class="nutrition-track" role="img" aria-label="已记录 ${e.n} 餐，估算 ${e.n?kcalText([e.lo,e.hi]):"暂无"} kcal，全天计划 ${kcalText(day)} kcal"><span style="width:${(pct*100).toFixed(1)}%"></span></div>
    <div class="nutrition-meta"><span>全天计划 <b>${kcalText(day)}</b> kcal</span><span>${e.n===4?"四餐都记下了":"按自己的节奏来"}</span></div>
    <p class="nutrition-note">${privateCoach?.active&&privateCoach.profile?.diet?"有饮食限制时，请优先记录实际食物。":"实际食物按记录计算，其余餐次按计划估算。"}</p></div>`;
}
let dietWeekOffset=0,dietSelectedDate=null;
function dietWeekCard(person,offset=dietWeekOffset){
  const today=new Date(),todayDate=ymd(today),mon=addDays(today,-((today.getDay()+6)%7)+offset*7),end=addDays(mon,6);
  const start=ymd(mon),last=ymd(end),days=Array.from({length:7},(_,i)=>addDays(mon,i));
  const floor=mealEditFloor(),canPrev=floor<start;
  const dates=Object.values(store.checkins).filter(c=>c.person===person&&/^\d{4}-\d{2}-\d{2}$/.test(c.date)&&c.date>=start&&c.date>=floor&&c.date<=last&&mealCount(c)).map(c=>c.date).sort();
  if(!dietSelectedDate||dietSelectedDate<start||dietSelectedDate>last||dietSelectedDate<floor||dietSelectedDate>todayDate){
    const latest=last<todayDate?last:todayDate;
    dietSelectedDate=offset===0?todayDate:dates.at(-1)|| (latest<floor?floor:latest);
  }
  const stamp=d=>`${d.getMonth()+1}/${d.getDate()}`;
  const buttons=days.map(d=>{const date=ymd(d),c=getCheckin(person,date),count=mealCount(c),future=date>todayDate;
    return `<button type="button" class="diary-date${date===todayDate?" today":""}" data-diet-date="${date}" aria-pressed="${date===dietSelectedDate}" aria-label="${date} ${future?"尚未开始":date<floor?"超出近 120 天范围":count?`已记录 ${count}/4 餐`:person===me?"未记录，可补打卡":"未记录"}"${future||date<floor?" disabled":""}><small>${date===todayDate?"今天":"周"+WEEK[d.getDay()]}</small><b>${d.getDate()}</b><span class="meal-dots" aria-hidden="true">${MEALS.map(m=>`<i class="${MEAL_STATES[c.meals?.[m]]?.[0]||""}"></i>`).join("")}</span></button>`;
  }).join("");
  const selected=getCheckin(person,dietSelectedDate),total=days.reduce((n,d)=>n+mealCount(getCheckin(person,ymd(d))),0);
  return `<div class="diet-week ${person}"><div class="diary-nav"><div><b>${offset===0?"这周的饮食":"饮食记录"}</b><small>${mon.getFullYear()} 年 ${stamp(mon)}—${stamp(end)} · 已记录 ${total} 餐</small></div><div class="calendar-arrows"><button type="button" data-diet-week="-1" aria-label="上一周"${canPrev?"":" disabled"}>${icon("back","sm")}</button><button type="button" data-diet-week="1" aria-label="下一周"${offset<0?"":" disabled"}>${icon("chevron-right","sm")}</button></div></div>
    <div class="diary-dates" role="group" aria-label="选择饮食记录日期">${buttons}</div>
    <div class="diary-day-title"><b>${shortDay(dietSelectedDate)}的饮食</b><span>${mealCount(selected)} / 4 餐${offset<0?` · <button type="button" data-diet-today>回到今天</button>`:""}</span></div>
    ${dietDayRows(person,dietSelectedDate,true)}<p class="diary-foot">${person===me?"选择近 120 天内的日期，可补记或修改当天每一餐。":"伴侣的饮食记录仅供查看。"}</p></div>`;
}
function viewDiet(){
  if(privateCoach?.active) viewP=me;
  const plan=MEAL_PLAN[viewP]; const w=new Date().getDay();
  const hasDietRule=!!(privateCoach?.active&&(privateCoach.profile?.diet?.trim()||/不吃|不能吃|过敏|忌口|乳糖|素食/.test(privateCoach.profile?.notes?.[2]||"")));
  const rows=MEALS.map(m=>`<article class="mplan ${viewP}">${mealHeading(m,plan[m].t,plan[m].time,mealKcal(viewP,m))}${mealPlanContent(viewP,m,hasDietRule)}</article>`).join('');
  const tn = (w>=1&&w<=5) ? `<div class="tonight"><span class="tag" style="margin:0 0 6px">今晚推荐</span><h4>${DINNERS[w].n}</h4><p>${DINNERS[w].h} · 约 ${DINNERS[w].kcal[viewP]} kcal</p></div>` : "";
  const dinners=[1,2,3,4,5].filter(d=>d!==w).map(d=>`<div class="dinner"><span class="d">周${WEEK[d]}</span>
    <div><h4>${DINNERS[d].n}</h4><p>${DINNERS[d].h}</p></div><span class="k">约 ${DINNERS[d].kcal[viewP]}</span></div>`).join("");
  $("#view").innerHTML=peekSwitch()+`
  ${moduleCard("饮食日志",ringCard(viewP),{id:"nutritionModule",person:viewP,meta:"把每一餐，慢慢记下来",symbol:"diet"})}
  ${moduleCard("饮食打卡记录",dietWeekCard(viewP),{id:"dietLogModule",person:viewP,meta:"按日期回看，每一餐都有迹可循",symbol:"record"})}
  <section class="sec ds-scene ${viewP}">${mealSectionHeading(viewP===me?"我的一天":PEOPLE[viewP].label+"的一天",ymd(new Date()),"diet",viewP)}
    <div class="card meal-plan-list ${viewP}">${rows}</div></section>
  ${hasDietRule?"":`<section class="sec">${secH("clock","晚餐轮换","15 分钟快手菜")}
    <div class="card">${tn}${dinners}</div>
    <p class="note" style="margin-top:10px">周日花 1 小时备菜：肉切好腌好分装冷冻，蔬菜洗好沥干装盒，工作日下锅就行。</p></section>`}
  <section class="sec">${secH("chat","常见场景")}
    <div class="card faq">
      <details><summary>沙拉酱怎么选？</summary><p>选油醋汁，只倒一半；沙拉里要有肉蛋和一点主食。</p></details>
      <details><summary>下午想喝咖啡？</summary><p>美式随便喝；拿铁就当加餐；避开糖浆、生椰、厚乳；3–4 点前喝完。</p></details>
      <details><summary>做饭用多少油？</summary><p>两人一顿控制在 1 勺以内。</p></details>
      <details><summary>带娃时的小习惯</summary><p>宝宝吃剩的饭和辅食不要自己吃掉。</p></details>
      <details><summary>加班饿了吃什么？</summary><p>无糖酸奶、鸡蛋、小番茄、黄瓜。</p></details>
    </div></section>`;
}

function planCard(key,canStart,done=false){
  const w=WORKOUTS[key];
  if(key==="D") return `<div class="card"><div class="plan-h"><div><h4 style="margin:0 0 2px;font-size:16px;font-weight:800">${icon("stretch")} ${w.name}</h4><p style="font-size:12px;color:var(--muted)">不计入训练打卡，久坐时随时做</p></div>
      ${canStart?`<button class="btn primary" data-start="D">开始</button>`:""}</div>
    <div class="desk" style="margin-top:12px">${w.moves.map(m=>`<div><span class="art" style="display:block">${moveArt(m.img,m.n)}</span><h5>${esc(m.n)}</h5><p>${esc(m.r)}</p></div>`).join("")}</div></div>`;
  return `<div class="obs plan today-plan ${me}"><div class="plan-h"><span class="tag2">今天要做的</span><span class="theirs">${roundsFor(key,me)} 轮 · ${w.equip}</span></div>
    <h4>${workoutTitle(key)}</h4><p>动作间休息 ${w.restMove} 秒，轮间 ${w.restRound} 秒</p>
    <ol class="ol">${w.moves.map((m,i)=>`<li class="has-art"><span class="art">${moveArt(m.img,m.n,{width:76,height:57})}<span class="n">${i+1}</span></span><div><h5>${esc(m.n)}</h5><small>${esc(m.c)}</small></div><span class="r">${esc(m.r)}</span></li>`).join("")}</ol>
    ${canStart?(done?`<button class="cta done" data-undo-workout>${icon("check","sm")} 今天已完成</button>`:`<button class="cta" data-start="${key}">${icon("play","sm")} 开始跟练</button>`):""}</div>`;
}
function viewTrain(){
  viewP=me;
  const today=new Date(); const mon=addDays(today,-((today.getDay()+6)%7));
  const short=k=>k==="W"?"臀腿":k==="A"||k==="B"?"力量":k==="N"?"徒手":k==="C"?"快走":k;
  const head=`<div class="wk2">`+[0,1,2,3,4,5,6].map(i=>{ const d=addDays(mon,i);
    return `<span class="h ${ymd(d)===ymd(today)?"now":""}">${ymd(d)===ymd(today)?"今天":"周"+WEEK[d.getDay()]}</span>`; }).join("")+`</div>`;
  const rows=[me].map(p=>{
    let cells="";
    for(let i=0;i<7;i++){
      const d=addDays(mon,i); const s=scheduleFor(p,d); const now=ymd(d)===ymd(today)?" now":"";
      const done = getCheckin(p,ymd(d)).workout==="done";
      if(s.kind==="rest") cells+=`<span class="c${now}">休</span>`;
      else if(s.kind==="flex") cells+=`<span class="c f${done?" done":""}${now}">${done?icon("check","sm"):"可选"}</span>`;
      else cells+=`<span class="c t${done?" done":""}${now}">${done?icon("check","sm"):short(s.w)}</span>`;
    }
    return `<div class="wkrow ${p}"><div class="who2">我的安排</div><div class="wk2">${cells}</div></div>`;
  }).join("");
  const s=scheduleFor(me,today),c=getCheckin(me,ymd(today)),rest=s.kind==="rest";
  const recovering=recoveryRest(c);
  const extra=`<div class="card extra-card" id="extraCard"><div><h4>${recovering?"已做动作记录":"休息日可选小活动"}</h4><p>${recovering?"今天以休息为主；已完成的动作可以自行记录。":"想活动一下就选一项，做完点打卡；不做也没关系。"}</p></div>
    <input class="extra-search" id="extraSearch" type="search" placeholder="搜索动作，如深蹲、拉伸、臀桥" aria-label="搜索想做的动作" value="${esc(extraMoveQuery)}">
    <div class="extra-results" id="extraResults">${extraMoveRows(c)}</div><p>额外动作仅保存在你的个人打卡里，伴侣看不到具体内容。</p></div>`;
  $("#view").innerHTML=`
  <section class="sec">
    ${rest?`<div class="obs today-plan"><span class="tag2">${icon("leaf","sm")} 今天休息</span><h4>${recovering?"先休息，照顾好身体":"今天没有必须完成的训练"}</h4><p>${recovering?"若有疼痛或身体不适，不要勉强运动。":"下方有可选小活动，做了再打卡即可。"}</p></div>${extra}`:planCard(s.w,true,c.workout==="done")}</section>
  ${moduleCard("这周我的安排",`${head}${rows}<p class="ds-module-note">${icon("check","sm")} 表示已完成的训练</p>`,{id:"weekModule",meta:"按自己的节奏，一天一点进步",art:"workout"})}
  ${rest?"":`<p class="note">膝盖或腰出现疼痛（不是肌肉酸）就先停下。感觉不适时，可以回到今日页调整今天的安排。</p>`}`;
}

function lastCheckinAt(person){
  let t=0; Object.values(store.checkins).forEach(c=>{ if(c.person===person && c.updatedAt>t) t=c.updatedAt; });
  return t;
}
function whenText(t){
  const d=new Date(t), now=new Date(); const hm=pad(d.getHours())+":"+pad(d.getMinutes());
  if(ymd(d)===ymd(now)) return "今天 "+hm;
  if(ymd(d)===ymd(addDays(now,-1))) return "昨天 "+hm;
  return (d.getMonth()+1)+"/"+d.getDate()+" "+hm;
}
function measureSeries(person){
  return Object.values(store.measures).filter(m=>m.person===person).sort((a,b)=>a.date<b.date?-1:1);
}
let recField="weight";
const FIELDS={weight:["体重","kg"],waist:["腰围","cm"],hip:["臀围","cm"],thigh:["大腿围","cm"]};
/* 平滑曲线：两个人各占上下一半、各自按自己的范围缩放（体重相差大时也能看清各自的走势） */
function smoothPath(pts){
  if(pts.length<2) return "";
  let d=`M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for(let i=0;i<pts.length-1;i++){
    const p0=pts[i-1]||pts[i], p1=pts[i], p2=pts[i+1], p3=pts[i+2]||p2;
    const c1=[p1[0]+(p2[0]-p0[0])/6, p1[1]+(p2[1]-p0[1])/6], c2=[p2[0]-(p3[0]-p1[0])/6, p2[1]-(p3[1]-p1[1])/6];
    d+=` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}
function trendCard(){
  if(privateCoach?.active) return privateTrendCard();
  const fields=["weight","waist"].concat(measureSeries("wife").some(m=>typeof m.hip==="number")?["hip"]:[]);
  if(!fields.includes(recField)) recField="weight";
  const [label,unit]=FIELDS[recField];
  const W=320,H=170,PX=18,BAND=H/2;
  const series=["hus","wife"].map((p,bi)=>({p,bi,pts:measureSeries(p).filter(m=>typeof m[recField]==="number").slice(-12)}));
  const toggle=`<div class="seg2" role="group" aria-label="看哪项趋势">${fields.map(f=>`<button data-rec-field="${f}" aria-pressed="${f===recField}">${FIELDS[f][0]}</button>`).join("")}</div>`;
  const legend=`<div class="legend">${series.map(s=>{ const l=s.pts[s.pts.length-1]; return `<span class="${s.p}"><i></i>${PEOPLE[s.p].label}${l?` <b>${l[recField]} ${unit}</b>`:" 还没有数据"}</span>`; }).join("")}</div>`;
  if(!series.some(s=>s.pts.length)) return `<div class="chart"><div class="chart-h"><b>两个人的趋势</b>${toggle}</div><p class="empty empty-mood"><img src="${mood(me,"sad")}" alt="">还没有${label}数据，记录两次以上就能看到趋势</p></div>`;
  const body=series.map(s=>{
    if(!s.pts.length) return `<text x="${W/2}" y="${s.bi*BAND+BAND/2+4}" text-anchor="middle" font-size="11" fill="var(--faint)">${PEOPLE[s.p].label}还没有${label}数据</text>`;
    const vals=s.pts.map(m=>m[recField]); let lo=Math.min(...vals), hi=Math.max(...vals); if(hi-lo<1){ lo-=.5; hi+=.5; }
    const top=s.bi*BAND+22, bot=(s.bi+1)*BAND-12;
    const n=s.pts.length, x=i=> n===1 ? W/2 : PX+(i/(n-1))*(W-2*PX), y=v=>bot-((v-lo)/(hi-lo))*(bot-top);
    const xy=s.pts.map((m,i)=>[x(i),y(m[recField])]);
    const line=smoothPath(xy); const mine=s.p===me; const col=`var(--${s.p})`;
    const area=line?`${line} L${xy[n-1][0].toFixed(1)},${bot+8} L${xy[0][0].toFixed(1)},${bot+8} Z`:"";
    const last=xy[n-1];
    return (area?`<path d="${area}" fill="url(#fill-${s.p})"/>`:"")+
      (line?`<path d="${line}" fill="none" stroke="${col}" stroke-width="${mine?3:2.5}" stroke-linecap="round" ${mine?"":`stroke-dasharray="1 6"`}/>`:"")+
      xy.map(([cx,cy],i)=>i===n-1?"":`<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="2.5" fill="${col}" opacity=".5"/>`).join("")+
      `<circle cx="${last[0].toFixed(1)}" cy="${last[1].toFixed(1)}" r="5" fill="var(--surface)" stroke="${col}" stroke-width="3"/>`+
      `<text x="${Math.min(last[0],W-24).toFixed(1)}" y="${(last[1]-10).toFixed(1)}" text-anchor="middle" font-size="11" font-weight="800" fill="${col}">${s.pts[n-1][recField]}</text>`;
  }).join("");
  const defs=`<defs>${["hus","wife"].map(p=>`<linearGradient id="fill-${p}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--${p})" stop-opacity=".22"/><stop offset="1" stop-color="var(--${p})" stop-opacity="0"/></linearGradient>`).join("")}</defs>`;
  return `<div class="chart"><div class="chart-h"><b>两个人的趋势</b>${toggle}</div>${legend}
    <div class="plot"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${label}趋势，最近 12 次">${defs}<line x1="${PX}" x2="${W-PX}" y1="${BAND}" y2="${BAND}" stroke="var(--line)" stroke-dasharray="3 5"/>${body}</svg></div>
    <p class="chart-foot">最近 12 次记录 · 两人各自按自己的范围显示走势</p></div>`;
}
function privateTrendCard(){
  const fields=["weight","waist"].concat(measureSeries(me).some(m=>typeof m.hip==="number")?["hip"]:[]);
  if(!fields.includes(recField)) recField="weight";
  const [label,unit]=FIELDS[recField],pts=measureSeries(me).filter(m=>typeof m[recField]==="number").slice(-12);
  const toggle=`<div class="seg2" role="group" aria-label="看哪项趋势">${fields.map(f=>`<button data-rec-field="${f}" aria-pressed="${f===recField}">${FIELDS[f][0]}</button>`).join("")}</div>`;
  if(!pts.length)return `<div class="chart"><div class="chart-h"><b>我的${label}趋势</b>${toggle}</div><p class="empty">还没有${label}数据</p></div>`;
  const vals=pts.map(m=>m[recField]),lo=Math.min(...vals)-.5,hi=Math.max(...vals)+.5;
  const xy=pts.map((m,i)=>[20+(pts.length===1?140:i*280/(pts.length-1)),100-(m[recField]-lo)/(hi-lo)*80]);
  const last=xy.at(-1),line=pts.length>1?`<polyline fill="none" stroke="var(--me)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" points="${xy.map(p=>p.map(n=>n.toFixed(1)).join(',')).join(' ')}"/>`:'';
  return `<div class="chart"><div class="chart-h"><b>我的${label}趋势</b>${toggle}</div><div class="plot"><svg viewBox="0 0 320 120" role="img" aria-label="我的${label}趋势，最新 ${pts.at(-1)[recField]} ${unit}"><line x1="20" x2="300" y1="100" y2="100" stroke="var(--line)" stroke-dasharray="3 5"/>${line}<circle cx="${last[0].toFixed(1)}" cy="${last[1].toFixed(1)}" r="5" fill="var(--surface)" stroke="var(--me)" stroke-width="3"/><text x="${last[0].toFixed(1)}" y="${(last[1]-12).toFixed(1)}" text-anchor="middle" font-size="12" font-weight="800" fill="var(--me-ink)">${pts.at(-1)[recField]}</text></svg></div><p class="chart-foot">最近 ${pts.length} 次 · 最新 ${pts.at(-1)[recField]} ${unit}${pts.length===1?' · 再记录一次即可形成趋势':''}</p></div>`;
}
function whoCard(p){
  const ms=measureSeries(p);
  const lastOf=k=>{ for(let i=ms.length-1;i>=0;i--) if(typeof ms[i][k]==="number") return ms[i]; return null; };
  const w=lastOf("weight"), waist=lastOf("waist");
  let trend="";
  if(w){
    const from=ymd(addDays(new Date(w.date+"T00:00:00"),-28));
    const base=ms.find(m=>typeof m.weight==="number" && m.date>=from && m.date<w.date);
    if(base){ const d=Math.round((w.weight-base.weight)*10)/10; trend=`近 4 周 ${d===0?"持平":(d>0?"+":"−")+Math.abs(d)+" kg"}`; }
  }
  const extra=[waist?`腰 ${waist.waist}`:"", ...(p==="wife"?[["hip","臀"],["thigh","腿"]].map(([k,l])=>{ const m=lastOf(k); return m?`${l} ${m[k]}`:""; }):[])].filter(Boolean).join(" · ");
  const withData=ms.filter(m=>["weight","waist","hip","thigh"].some(k=>typeof m[k]==="number"));
  const latest=withData.length?withData[withData.length-1].date:"";
  const gp=planFor(p);
  return `<div class="who-card ${p}">
    <div class="ava"><img src="assets/avatar-${p}.webp?v=media1" alt="${PEOPLE[p].label}的形象" width="70" height="70"></div>
    <h4>${PEOPLE[p].label}</h4>
    ${withData.length?`<div class="w">${w?`${w.weight}<small>kg</small>`:"—"}</div>
    ${extra?`<p>${esc(extra)}</p>`:""}${trend?`<p>${trend}</p>`:""}${gp?`<span class="chip me2">${icon("goal","sm")}${gp.maintain?"维持中":`还差 ${gp.toGo} kg`}</span>`:""}${latest?`<p>最新 ${+latest.slice(5,7)}/${+latest.slice(8)}</p>`:""}`
    :`<p>还没有记录</p>`}
  </div>`;
}
function shortDay(date){
  const t=ymd(new Date()), y=ymd(addDays(new Date(),-1));
  return date===t?"今天":date===y?"昨天":`${+date.slice(5,7)}/${+date.slice(8)}`;
}
/* 某人某项在 date 之前最近一次的值 */
function prevValue(person,field,date){
  const ms=measureSeries(person).filter(m=>typeof m[field]==="number" && m.date<date);
  return ms.length?ms[ms.length-1][field]:null;
}
const fmtDelta=(d,unit)=>{ d=Math.round(d*10)/10; return d===0?"持平":(d>0?"+":"−")+Math.abs(d)+" "+unit; };
/* A day counts when a check-in was saved, independently of meal completion. */
let historyWindowOffset=0,historySelectedDate=null,historyPerson=null;
function activityInfo(person){
  const today=ymd(new Date()),floor=ymd(addDays(new Date(),-119));
  if(privateCoach?.active&&person!==me){
    const since=privateCoach.partnerActivitySince,until=privateCoach.partnerActivityUntil;
    const known=/^\d{4}-\d{2}-\d{2}$/.test(since||"")&&/^\d{4}-\d{2}-\d{2}$/.test(until||"")&&since<=until&&until<=today;
    return {since:known?since:floor,until:known?until:null,ready:known&&until>=ymd(addDays(new Date(),-1)),checked:date=>known&&date>=since&&date<=until?privateCoach.partnerChecked(date):null};
  }
  return {since:floor,until:today,ready:true,checked:date=>date>today?null:!!store.checkins[person+"_"+date]||(date<floor?null:false)};
}
function activityStreak(checked,since=ymd(addDays(new Date(),-119))){
  let date=new Date(),n=0;
  if(checked(ymd(date))!==true)date=addDays(date,-1);
  for(let i=0;i<120&&ymd(date)>=since;i++){if(checked(ymd(date))!==true)break;n++;date=addDays(date,-1);}
  return {count:n,capped:n>0&&ymd(date)<since};
}
function coupleStreakCard(){
  const info={hus:activityInfo("hus"),wife:activityInfo("wife")},bothReady=info.hus.ready&&info.wife.ready;
  const joint=activityStreak(date=>info.hus.checked(date)===true&&info.wife.checked(date)===true,info.hus.since>info.wife.since?info.hus.since:info.wife.since);
  const week=addDays(new Date(),-((new Date().getDay()+6)%7));
  const rows=["hus","wife"].map(person=>{const a=info[person],s=activityStreak(a.checked,a.since),count=Array.from({length:7},(_,i)=>ymd(addDays(week,i))).filter(d=>a.checked(d)===true).length;
    return `<div class="habit-person ${person}"><div class="habit-person-head"><img src="assets/avatar-${person}.webp?v=media1" alt="" width="36" height="36"><b>${PEOPLE[person].label}</b></div><span class="habit-label">连续记录</span><div class="habit-number"><b>${a.ready?s.count+(s.capped?"+":""):"—"}</b><span>天</span></div><small>${a.ready?`本周记录 ${count} 天`:"历史状态待同步"}</small></div>`;
  }).join("");
  return `<div class="habit-card"><div class="habit-heading"><div><h4>一起坚持的日子</h4><p>每一次记录，都是在照顾自己。</p></div><span class="habit-heart" aria-hidden="true">${icon("heart")}</span></div><div class="habit-people">${rows}</div><div class="habit-together">${icon("people","sm")}<span>两人同日连续记录 <b>${bothReady?joint.count+(joint.capped?"+":"")+" 天":"待同步"}</b></span></div><p class="habit-note">当天保存过打卡就算记录，今天尚未记录时沿用昨天的连续天数。连续天数按近 120 天的打卡状态统计。</p></div>`;
}
function checkinHistoryCard(){
  const today=new Date(),todayDate=ymd(today),mon=addDays(today,-((today.getDay()+6)%7)),start=addDays(mon,-21+historyWindowOffset*28),end=addDays(start,27);
  const first=ymd(start),last=ymd(end),info={hus:activityInfo("hus"),wife:activityInfo("wife")};
  const ownDates=Object.values(store.checkins).filter(c=>c.person===me&&/^\d{4}-\d{2}-\d{2}$/.test(c.date)&&c.date<=todayDate).map(c=>c.date).sort();
  const earliest=[ownDates[0],...Object.values(info).filter(a=>a.ready).map(a=>a.since)].filter(Boolean).sort()[0];
  if(!historySelectedDate||historySelectedDate<first||historySelectedDate>last||historySelectedDate>todayDate)historySelectedDate=historyWindowOffset===0?todayDate:ownDates.filter(d=>d>=first&&d<=last).at(-1)||last;
  const stateLabel=(person,date)=>{const checked=info[person].checked(date);return PEOPLE[person].label+(checked===true?"已记录":checked===false?"未记录":"未同步");};
  const cells=Array.from({length:28},(_,i)=>{const date=ymd(addDays(start,i)),future=date>todayDate;
    return `<button type="button" class="habit-day${date===todayDate?" today":""}" data-history-date="${date}" aria-pressed="${date===historySelectedDate}" aria-label="${date} ${future?"尚未开始":["hus","wife"].map(p=>stateLabel(p,date)).join("，")}"${future?" disabled":""}><b>${Number(date.slice(8))}</b><span aria-hidden="true">${["hus","wife"].map(p=>`<i class="${p} ${info[p].checked(date)===true?"checked":info[p].checked(date)===null?"unknown":""}"></i>`).join("")}</span></button>`;
  }).join("");
  if(!['hus','wife'].includes(historyPerson))historyPerson=me;
  const peer=historyPerson!==me,isPrivatePeer=peer&&privateCoach?.active;
  const selected=isPrivatePeer?privateCoach.partnerCheckin?.(historySelectedDate):getCheckin(historyPerson,historySelectedDate);
  const hasRecord=isPrivatePeer?!!selected:!!store.checkins[historyPerson+"_"+historySelectedDate];
  const peerState=privateCoach?.partnerRecordSharing||'unknown';
  const unavailable=isPrivatePeer&&peerState!=='on';
  const unavailableText=peerState==='unpaired'?"还没有配对的伴侣。":peerState==='off'?"伴侣已关闭打卡详情共享，可由伴侣在记录页的「设置 → 共享我的打卡详情」中重新开启。":"暂时无法确认伴侣的共享记录，请联网后重新连接。";
  const outsideRange=isPrivatePeer&&historySelectedDate<(privateCoach.partnerActivitySince||activityInfo(historyPerson).since);
  const pending=isPrivatePeer&&peerState==="on"&&!hasRecord&&!privateCoach.partnerLoadedDates?.has(historySelectedDate);
  const details=outsideRange?`<p class="history-empty">伴侣详情可查看近 120 天的记录。</p>`:pending?`<p class="history-empty" role="status">正在读取伴侣这一天的记录…</p>`:unavailable?`<p class="history-empty" role="status">${unavailableText}</p>`:hasRecord?dietDayRows(historyPerson,historySelectedDate,false,selected)+`<div class="ds-activity-list"><div class="history-activity"><span>${icon("train","sm")} 训练</span><b>${selected.workout==="done"?"已完成":"未记录完成"}</b></div>${selected.stand?`<div class="history-activity"><span>${icon("desk","sm")} 起身活动</span><b>${Number(selected.stand)||0} 次</b></div>`:""}${extraDone(selected).length?`<div class="history-activity"><span>${icon("stretch","sm")} 可选活动</span><b>${extraDone(selected).length} 项</b></div>`:""}</div>`:`<p class="history-empty">这天还没有${peer?"伴侣":"你"}的打卡记录。</p>`;
  return `<div class="checkin-history"><section class="history-calendar" aria-label="历史打卡日历"><div class="diary-nav"><div><b>两个人的打卡足迹</b><small>${first.replaceAll("-","/")}—${last.slice(5).replace("-","/")}</small></div><div class="calendar-arrows"><button type="button" data-history-window="-1" aria-label="更早四周"${earliest&&earliest<first?"":" disabled"}>${icon("back","sm")}</button><button type="button" data-history-window="1" aria-label="更新四周"${historyWindowOffset<0?"":" disabled"}>${icon("chevron-right","sm")}</button></div></div>
    <div class="habit-weekdays">${["一","二","三","四","五","六","日"].map(d=>`<span>${d}</span>`).join("")}</div><div class="habit-calendar" role="group" aria-label="选择历史打卡日期">${cells}</div>
    <div class="habit-legend"><span><i class="hus"></i>老公</span><span><i class="wife"></i>老婆</span><span><i class="unknown"></i>未同步</span><small>点日期看当天</small></div></section>    <div class="history-day ${historyPerson}"><div class="diary-day-title"><b>${shortDay(historySelectedDate)}的记录</b><span>${Number(historySelectedDate.slice(5,7))}月${Number(historySelectedDate.slice(8))}日</span></div><div class="history-partner-status ds-role-tabs" role="group" aria-label="查看谁的打卡记录">${["hus","wife"].map(p=>`<button type="button" class="${p}" data-history-person="${p}" aria-pressed="${historyPerson===p}" aria-label="查看${PEOPLE[p].label}的打卡记录">${icon("person","sm")}${PEOPLE[p].label}</button>`).join("")}</div><div class="history-view-label"><span>正在查看${PEOPLE[historyPerson].label}的记录${peer?" · 只读":""}</span>${isPrivatePeer?`<button type="button" class="linkbtn" data-coach="sharing-refresh"${privateCoach.partnerReadBusy?" disabled":""}>${privateCoach.partnerReadBusy?"刷新中…":"刷新记录"}</button>`:""}</div>${details}</div><p class="diary-foot">打卡详情由本人决定是否向伴侣共享；目标、体重、围度和健康档案仅自己可见。</p></div>`;
}

function insightCard(){return coupleStreakCard();}
function feedRows(){
  const hist=Object.values(store.measures).filter(m=>(!privateCoach?.active||m.person===me)&&["weight","waist","hip","thigh"].some(k=>typeof m[k]==="number")).sort((a,b)=>a.date<b.date?1:-1).slice(0,6);
  if(!hist.length) return `<p class="empty empty-mood"><img src="${mood(me,"sad")}" alt="">还没有记录。每周日早上空腹量一次。</p>`;
  return hist.map(m=>{
    const extra=[m.waist!=null?`腰围 ${m.waist}`:"",m.hip!=null?`臀围 ${m.hip}`:"",m.thigh!=null?`腿围 ${m.thigh}`:""].filter(Boolean).join(" · ");
    const pw=m.weight!=null?prevValue(m.person,"weight",m.date):null;
    return `<div class="feed ${m.person}"><img src="assets/avatar-${m.person}.webp?v=media1" alt="" width="40" height="40">
      <div class="t"><div><b>${PEOPLE[m.person].label}</b><span class="chip">${shortDay(m.date)}</span></div><small>${esc(extra)||"只记了体重"}</small></div>
      <div class="v">${m.weight!=null?`<b>${m.weight} kg</b><small>${pw!=null?fmtDelta(m.weight-pw,"kg"):"第一次记录"}</small>`:""}</div></div>`;
  }).join("");
}
function renderRecordData(){
  const pair=$("#recPair"); if(pair) pair.innerHTML=privateCoach?.active ? whoCard(me)+privateCoach.partnerCard() : whoCard("hus")+whoCard("wife");
  const gc=$("#recGoal"); if(gc) gc.innerHTML=goalCard();
  const ins=$("#recInsight"); if(ins) ins.innerHTML=insightCard();
  const history=$("#recHistory");if(history){history.innerHTML=checkinHistoryCard();if(privateCoach?.active&&historyPerson!==me)privateCoach.ensurePartnerCheckin?.(historySelectedDate);}
  const title=$("#recTitle");if(title)title.innerHTML=recordSectionHeading();
  const box=$("#recData"); if(!box) return;
  box.innerHTML=`<section class="ds-module-section" aria-label="趋势">${trendCard()}</section><section class="ds-module-section"><h4>最近更新</h4>${feedRows()}</section>`;
}
function viewRecord(){
  const today=ymd(new Date());
  const ex=store.measures[me+"_"+today]||{};
  const v=k=>ex[k]!=null?ex[k]:"";
  const tiles=[["weight","晨起体重","kg",0.1,30,200],["waist","腰围","cm",0.5,40,160]].concat(me==="wife"?[["hip","臀围","cm",0.5,50,160],["thigh","大腿围","cm",0.5,30,100]]:[]);
  const tile=([k,l,u,st,mn,mx])=>{ const pv=prevValue(me,k,today);
    return `<label class="mtile"><span class="ml">${l}</span><span class="mv"><input type="number" inputmode="decimal" step="${st}" min="${mn}" max="${mx}" name="${k}" value="${v(k)}" placeholder="${pv!=null?pv:"—"}" data-prev="${pv!=null?pv:""}" data-unit="${u}"><i>${u}</i></span>
      <span class="md" data-delta="${k}">${pv!=null?`上次 ${pv} ${u}`:"还没有记录"}</span></label>`; };
  const tokenCard = CLOUD && !privateCoach?.active ? `<section class="sec">${secH("key","家庭同步口令")}
    <div class="card"><div class="token"><span class="k">${family?icon("key","sm")+" "+esc(family.slice(0,4))+"••••••":"还没设置口令"}</span>
      ${family?`<button class="btn primary" data-code-copy>复制邀请信息</button>`:`<button class="btn primary" data-open-code>去设置</button>`}</div>
      ${family?`<button class="linkbtn" data-open-code>查看或修改口令</button>`:`<p class="empty" style="padding-top:8px">两台手机填同一个口令，数据才会同步到一起。</p>`}</div></section>` : "";
  $("#view").innerHTML=`
  <section class="sec ds-scene ${me}"><div id="recTitle">${recordSectionHeading()}</div>
  <div id="recInsight"></div><div id="recHistory"></div></section>
  ${moduleCard("我的目标",`<div id="recGoal">${goalCard()}</div>`,{id:"goalModule",meta:"让目标更贴近现在的自己",symbol:"goal"})}
  ${moduleCard("我与伴侣",`<div class="pair" id="recPair"></div>`,{id:"pairModule",meta:"各自努力，也彼此陪伴",symbol:"people"})}
  ${moduleCard("记录"+PEOPLE[me].label+"的数据",`<form class="form2" id="mForm">
      <div class="fh"><span>记在哪天</span><input type="date" name="date" value="${today}" max="${today}" aria-label="日期"></div>
      <div class="mtiles">${tiles.map(tile).join("")}</div>
      <button class="cta" type="submit">${icon("check","sm")} 保存记录</button>
    </form><div id="recData"></div>`,{id:"bodyModule",meta:"记录、趋势与更新，都在这里",art:"weigh"})}${privateCoach?.active?privateCoach.pushCard()+`<details class="private-settings"><summary>${icon("settings")}<span>设置</span>${icon("chevron-down","settings-chevron")}</summary><div class="private-settings-body"><p>私人档案仅自己可见。换手机前请保存个人恢复码。</p><button type="button" data-coach="sharing-open">共享我的打卡详情</button><button type="button" data-coach="show-recovery">生成新的个人恢复码</button><button type="button" data-coach="copy-family">复制家庭配对口令</button><button type="button" data-coach="connection-copy">复制连接诊断</button><button type="button" data-coach="signout">清除本机登录</button></div></details>`:""}${tokenCard}`;
  renderRecordData();
  $("#mForm").addEventListener("input",e=>{
    const i=e.target; if(!i.dataset || i.name==="date") return;
    const d=$(`[data-delta="${i.name}"]`); if(!d) return;
    const pv=i.dataset.prev, u=i.dataset.unit;
    d.textContent = i.value!=="" && pv!=="" ? "较上次 "+fmtDelta(Number(i.value)-Number(pv),u) : (pv!==""?`上次 ${pv} ${u}`:"还没有记录");
  });
  $("#mForm").addEventListener("submit",e=>{
    e.preventDefault(); const f=new FormData(e.target); const d0=f.get("date")||today; const body={...(store.measures[me+"_"+d0]||{}),person:me,date:d0};
    let any=false;
    ["weight","waist","hip","thigh"].forEach(k=>{ const raw=f.get(k); if(raw!==null && raw!==""){ const n=Number(raw); if(!isNaN(n)){ body[k]=n; any=true; } } });
    if(!any){ toast("至少填一项再保存"); return; }
    putMeasure(body); react("weigh","已保存记录","看 3–4 周的趋势，别看单日");
  });
}

function render(){
  if(startupPending)return;
  renderHeader(); renderSync();
  if(runState) return; // don't touch views mid-workout
  if(tab==="today") viewToday();
  else if(tab==="diet") viewDiet();
  else if(tab==="train") viewTrain();
  else if(tab==="record"){ if($("#mForm") && lastTab==="record" && lastMe===me) renderRecordData(); else viewRecord(); }
  lastTab=tab; lastMe=me;
}
let lastTab=null,lastMe=null;

/* ---------- workout runner ---------- */
let runState=null, timer=null, moveWarmTimer=null;
const warmedMoves=new Set();
function warmNextMove(){
  clearTimeout(moveWarmTimer);
  if(!runState||navigator.connection?.saveData||/2g/.test(navigator.connection?.effectiveType||""))return;
  const next=runState.steps.slice(runState.i+1).find(step=>step.type==="move");
  if(!next||typeof Image==="undefined")return;
  const url=moveURL(next.m.img,true);if(warmedMoves.has(url))return;
  // Warm only the next movement, after the current screen has had time to request its images.
  moveWarmTimer=setTimeout(()=>{
    if(!runState)return;
    warmedMoves.add(url);const image=new Image();image.decoding="async";image.fetchPriority="low";
    image.onerror=()=>warmedMoves.delete(url);image.src=url;
  },350);
}
function buildSteps(key){
  const w=WORKOUTS[key]; const steps=[];
  if(w.warm.length) steps.push({type:"list",title:"先热身",items:w.warm,btn:"热身完成"});
  const R=roundsFor(key,me);
  for(let r=1;r<=R;r++){
    w.moves.forEach((m,i)=>{
      steps.push({type:"move",m,round:r,idx:i+1});
      const lastMove=i===w.moves.length-1;
      if(!lastMove && w.restMove) steps.push({type:"rest",sec:w.restMove,next:w.moves[i+1].n});
      if(lastMove && r<R && w.restRound) steps.push({type:"rest",sec:w.restRound,next:"第 "+(r+1)+" 轮："+w.moves[0].n,round:true});
    });
  }
  if(w.cool.length) steps.push({type:"list",title:"放松一下",items:w.cool,btn:"放松完成"});
  steps.push({type:"end"});
  return steps;
}
function startRun(key){
  runState={key,steps:buildSteps(key),i:0,sec:0,running:false};
  $("#run").classList.add("open"); document.body.style.overflow="hidden"; drawRun();
}
function stopTimer(){ clearInterval(timer); timer=null; }
function closeRun(){ stopTimer();clearTimeout(moveWarmTimer);runState=null; $("#run").classList.remove("open"); document.body.style.overflow=""; render(); }
function nextStep(){ stopTimer(); runState.i++; runState.running=false; drawRun(); }
const RUN_C=2*Math.PI*88;
function timerRing(sec,total){
  return `<div class="tring"><svg viewBox="0 0 200 200"><circle cx="100" cy="100" r="88" fill="none" stroke="var(--sunk)" stroke-width="14"/>
    <circle id="cdRing" cx="100" cy="100" r="88" fill="none" stroke="var(--me)" stroke-width="14" stroke-linecap="round" stroke-dasharray="${RUN_C.toFixed(1)}" stroke-dashoffset="${(RUN_C*(1-sec/total)).toFixed(1)}"/></svg>
    <div><b class="big" id="cd">${sec}</b><small>秒</small></div></div>`;
}
function countdown(sec,onEnd){
  runState.sec=sec; runState.total=runState.total||sec; stopTimer();
  timer=setInterval(()=>{ runState.sec--; const el=$("#cd"); if(el) el.textContent=runState.sec;
    const rg=$("#cdRing"); if(rg && runState.total) rg.style.strokeDashoffset=(RUN_C*(1-runState.sec/runState.total)).toFixed(1);
    if(runState.sec<=0){ stopTimer(); try{ navigator.vibrate&&navigator.vibrate(200);}catch(e){} onEnd(); } },1000);
}
function drawRun(){
  const st=runState; const w=WORKOUTS[st.key]; const s=st.steps[st.i];
  const pct=Math.round(st.i/(st.steps.length-1)*100);
  let body="";
  if(s.type==="list"){
    st.total=0;
    body=`<div class="rcard"><span class="tag2 light">${icon(s.title==="先热身"?"flame":"leaf","sm")} ${s.title==="先热身"?"热身":"放松"}</span><h2>${s.title}</h2>
      <ol class="rlist">${s.items.map((x,i)=>{const media=LIST_MOVE_MEDIA[x]||[];return `<li><span>${i+1}</span>${media.map(([id,alt])=>moveArt(id,alt,{className:"list-art"+(media.length>1?" duo":""),width:80,height:60})).join("")}<b>${esc(x)}</b></li>`}).join("")}</ol></div>
      <div class="actions"><button class="cta" data-run="next">${s.btn}</button></div>`;
  }else if(s.type==="move"){
    const timed=!!s.m.sec;
    st.total = timed ? s.m.sec : 0;
    body=`<div class="rcard"><div class="media exercise-media">${moveArt(s.m.img,s.m.n,{full:true,loading:"eager",width:800,height:600})}</div>
      <span class="tag2 light">第 ${s.round} 轮 · 动作 ${s.idx}/${w.moves.length}</span>
      <h2>${esc(s.m.n)}</h2><p class="reps">${esc(s.m.r)}</p><p class="cue">${icon("bulb","sm")} ${esc(s.m.c)}</p></div>
      ${timed?timerRing(st.running?st.sec:s.m.sec,s.m.sec):""}
      <div class="actions">${timed&&!st.running?`<button class="cta" data-run="timer">${icon("play","sm")} 开始计时</button>`:""}
      ${timed&&st.running?`<button class="btn ghost" data-run="next">提前结束</button>`:""}
      ${!timed?`<button class="cta" data-run="next">${icon("check","sm")} 做完了</button>`:""}</div>`;
  }else if(s.type==="rest"){
    st.total=s.sec;
    body=`<div class="rrest"><img class="mood" src="${mood(me,s.round?"happy":"workout")}" alt=""><h2>${s.round?"这一轮完成，休息一下 🎉":"休息一下"}</h2>
      ${timerRing(s.sec,s.sec)}
      <p class="next">下一个 <b>${esc(s.next)}</b></p></div>
      <div class="actions"><button class="btn ghost" data-run="next">跳过休息</button></div>`;
  }else{
    body=`<div class="rend"><img src="${mood(me,"happy")}" alt="${PEOPLE[me].label}开心地庆祝" width="140" height="140"><h2>练完了 ✨</h2><p class="cue">${workoutTitle(st.key)}，${roundsFor(st.key,me)} 轮全部完成。</p></div>
      <div class="actions">${st.key==="D"?"":`<button class="cta" data-run="finish">记录完成并返回</button>`}
      <button class="btn ghost" data-run="close">返回</button></div>`;
  }
  $("#runBody").innerHTML=`<div class="run-top"><button data-run="close">✕ 退出</button><span>${workoutTitle(st.key)}</span><span class="pc">${pct}%</span></div>
    <div class="bar"><i style="width:${pct}%"></i></div>${body}`;
  if(s.type==="rest") countdown(s.sec,nextStep);
  warmNextMove();
}

/* ---------- events ---------- */
document.addEventListener("input",e=>{
  if(e.target.id!=="extraSearch")return;
  extraMoveQuery=e.target.value;
  const results=$("#extraResults");
  if(results)results.innerHTML=extraMoveRows(getCheckin(me,ymd(new Date())));
});
document.addEventListener("click",async e=>{
  const t=e.target.closest("button"); if(!t) return;
  if(t.dataset.pick){
    if(privateCoach){
      const btn=t; btn.disabled=true; const label=btn.textContent; btn.textContent="正在打开你的档案…";
      try{privateCoach.beginRole(t.dataset.pick,$("#entryFamily").value);closePicker();}
      catch(err){const issue=$("#entryIssue");issue.textContent=/duplicate key|fl_members_family_person_key|account_already_paired/i.test(err.message)?"这个角色已有档案，请用下方的个人恢复码找回，或检查家庭口令。":err.message;issue.hidden=false;}
      finally{btn.disabled=false;btn.textContent=label;}
      return;
    }
    me=t.dataset.pick; viewP=me; try{ localStorage.setItem(LS_ME,me);}catch(_){} closePicker(); lastTab=null; render(); if(CLOUD && !family) openCode(true); else if(!goalOf(me)) openGoal(); return;
  }
  if(t.hasAttribute("data-open-code")){ openCode(); return; }
  if(t.hasAttribute("data-open-goal")){ if(privateCoach?.active){privateCoach.editProfile();return;} openGoal(); return; }
  if(t.dataset.food){ openFood(t.dataset.food,t.dataset.foodDate||ymd(new Date())); return; }
  if(t.hasAttribute("data-food-close")){ closeFood(); return; }
  if(t.hasAttribute("data-food-save")){ saveFood(); return; }
  if(t.hasAttribute("data-food-ai")){ aiFood(); return; }
  if(t.hasAttribute("data-food-clear")){ clearFood(); return; }
  if(t.dataset.chip){ const ta=$("#foodText"); ta.value=(ta.value.trim()?ta.value.trim()+"，":"")+t.dataset.chip; onFoodText(); return; }
  if(t.dataset.fx){ foodRows.splice(+t.dataset.fx,1); drawFood(); return; }
  if(t.hasAttribute("data-goal-close")){ closeGoal(); return; }
  if(t.dataset.sugg){
    const list=suggestionsFor(me), g=goalOf(me);
    if(t.dataset.sugg==="skip"){ try{ localStorage.setItem("fatloss.sugg."+me, ymd(new Date()).slice(0,4)+"-"+isoWeek(new Date())+g.at); }catch(_){} lastTab=null; render(); return; }
    const patch={adj:g.adj||0, level:g.level||0, cardio:!!g.cardio, mode:g.mode||null};
    list.forEach(x=>{ if(x.k==="adj") patch.adj+=x.v; if(x.k==="level") patch.level+=x.v; if(x.k==="cardio") patch.cardio=true; if(x.k==="maintain") patch.mode="maintain"; });
    saveGoal(me,patch); menuCache={}; lastTab=null; render(); react("happy","已按建议调整","新的份量和训练从今天开始"); return;
  }
  if(t.hasAttribute("data-code-gen")){ codeCreating=true; $("#codeInput").value=genCode(); return; }
  if(t.hasAttribute("data-code-save")){ saveCode(); return; }
  if(t.hasAttribute("data-code-copy")){ copyInvite(); return; }
  if(t.hasAttribute("data-code-close")){ codeNextGoal=false; $("#codeDlg").classList.remove("open"); document.body.style.overflow=""; lastTab=null; render(); return; }
  if(t.hasAttribute("data-pick-cancel")){ closePicker(); return; }
  if(t.dataset.lmRole){ lmSelect(t.dataset.lmRole); return; }
  if(t.hasAttribute("data-lm-skip")){ if($("#lm").classList.contains("splash")){ $("#lm").onclick?.(); return; } lmClear(); lmPhase("choose"); finishStartup(); return; }
  if(t.hasAttribute("data-lm-replay")){ lmPlay(); return; }
  if(t.hasAttribute("data-open-picker")){ if(privateCoach) return; openPicker(true); return; }
  if(t.dataset.dietWeek){
    const today=new Date(),next=dietWeekOffset+Number(t.dataset.dietWeek);
    const weekEnd=ymd(addDays(today,-((today.getDay()+6)%7)+next*7+6));
    if(next<=0&&mealEditFloor()<=weekEnd)dietWeekOffset=next;
    dietSelectedDate=null;viewDiet();return;
  }
  if(t.dataset.dietDate){if(canEditMealDate(me,t.dataset.dietDate))dietSelectedDate=t.dataset.dietDate;viewDiet();return;}
  if(t.hasAttribute("data-diet-today")){dietWeekOffset=0;dietSelectedDate=null;viewDiet();return;}
  if(t.dataset.historyPerson){historyPerson=t.dataset.historyPerson;renderRecordData();return;}
  if(t.dataset.historyDate){historySelectedDate=t.dataset.historyDate;renderRecordData();return;}
  if(t.dataset.historyWindow){historyWindowOffset=Math.min(0,historyWindowOffset+Number(t.dataset.historyWindow));historySelectedDate=null;renderRecordData();return;}
  if(t.dataset.view){ if(privateCoach?.active)return; viewP=t.dataset.view; lastTab=null; render(); return; }
  if(t.dataset.recField){ recField=t.dataset.recField; renderRecordData(); return; }
  if(t.hasAttribute("data-open-extra")){
    tab="train"; document.querySelectorAll(".tabs button").forEach(b=>{if(b.dataset.tab==="train")b.setAttribute("aria-current","page");else b.removeAttribute("aria-current");});
    lastTab=null;render();scrollToPageStart();return;
  }
  if(t.dataset.tab){ tab=t.dataset.tab; document.querySelectorAll(".tabs button").forEach(b=>{ if(b===t) b.setAttribute("aria-current","page"); else b.removeAttribute("aria-current"); });
    lastTab=null; render(); scrollToPageStart(); return; }
  if(t.dataset.extraMove){
    if(readOnly)return;
    const move=EXTRA_MOVES.find(m=>m.img===t.dataset.extraMove);if(!move)return;
    const date=ymd(new Date()),c=JSON.parse(JSON.stringify(getCheckin(me,date)));
    const next=toggleExtraMove(c,move.img);
    putCheckin(next);if(next.extraMoves.includes(move.img))react("workout",move.n+"已打卡","今天额外动了一下，也记下来了");return;
  }
  if(t.dataset.meal){
    const date=t.dataset.mealDate||ymd(new Date());
    if(readOnly||!canEditMealDate(me,date)||t.dataset.mealDate&&tab!=="diet"){ toast("这一天的记录不可修改"); return; }
    const c=JSON.parse(JSON.stringify(getCheckin(me,date)));
    c.meals=c.meals||{}; c.meals[t.dataset.meal] = c.meals[t.dataset.meal]===t.dataset.v ? null : t.dataset.v;
    if(!c.meals[t.dataset.meal]) delete c.meals[t.dataset.meal];
    const today=date===ymd(new Date()),was=today&&dayDone(me,new Date());
    putCheckin(c);
    const v=c.meals[t.dataset.meal];
    if(today){
      if(!was && dayDone(me,new Date())) react("day-done","今天全部完成啦",scheduleFor(me,new Date()).kind==="train"?"四餐和训练都打卡了，明天继续":"四餐都打卡了，明天继续",true);
      else if(v==="plan") react("meal","按计划吃完啦 ✨",MEAL_PLAN[me][t.dataset.meal].t+"已打卡");
      else if(v==="over") react("meal","吃多了没关系","下一顿正常吃就好，不用饿肚子补回来");
    }else toast(shortDay(date)+"的"+MEAL_NAMES[t.dataset.meal]+"已更新");
    return;
  }
  if(t.dataset.stand){
    if(readOnly){ toast("你现在只有查看权限"); return; }
    const date=ymd(new Date()); const c=JSON.parse(JSON.stringify(getCheckin(me,date)));
    c.stand=Math.max(0,Math.min(20,(c.stand||0)+Number(t.dataset.stand))); putCheckin(c,700); return;
  }
  if(t.hasAttribute("data-undo-workout")){
    if(readOnly) return;
    if(!confirm("撤销今天的训练打卡？")) return;
    const date=ymd(new Date()); const c=JSON.parse(JSON.stringify(getCheckin(me,date))); c.workout=null; putCheckin(c); return;
  }
  if(t.dataset.start){ startRun(t.dataset.start); return; }
  if(t.dataset.run){
    const a=t.dataset.run;
    if(a==="next") nextStep();
    else if(a==="close"){ if(runState && runState.steps[runState.i].type!=="end" && runState.i>0 && !confirm("训练还没做完，确定退出？")) return; closeRun(); }
    else if(a==="timer"){ const s=runState.steps[runState.i]; runState.running=true; runState.sec=s.m.sec; drawRun(); countdown(s.m.sec,nextStep); }
    else if(a==="finish"){
      if(!readOnly){ const date=ymd(new Date()); const c=JSON.parse(JSON.stringify(getCheckin(me,date))); c.workout="done"; runState=null; putCheckin(c);
        if(dayDone(me,new Date())) react("day-done","今天全部完成啦","训练和四餐都打卡了",true); else react("happy","训练已打卡 💪","剩下的按计划来"); }
      closeRun();
    }
  }
});

let toastT=null;
function toast(msg,ms){ const el=$("#toast"); el.textContent=msg; el.classList.add("show"); clearTimeout(toastT); toastT=setTimeout(()=>el.classList.remove("show"),ms||2600); }

/* 登录动效：start → run → meet → choose。首次进入播放；右上角切换身份时直接到选择这一步 */
let lmTimers=[], lmRole=null;
function lmPhase(name){ $("#lm").dataset.phase=name; const ready=name==="choose"; $("#lmChoice").inert=!ready; $("#lmChoice").setAttribute("aria-hidden",String(!ready)); }
function lmClear(){ lmTimers.forEach(clearTimeout); lmTimers=[]; window.duoEntry?.stop(); }
/* 跑步图解码好再开跑，最多等 1.2 秒，避免"动画在播、人还没出来" */
function lmReady(){
  const imgs=[...document.querySelectorAll(".lm-runner img")];
  const decoded=Promise.all(imgs.map(i=>i.decode?i.decode().catch(()=>{}):Promise.resolve()));
  return Promise.race([decoded,new Promise(r=>setTimeout(r,1200))]);
}
function lmSelect(role){
  lmRole=role;
  document.querySelectorAll("[data-lm-role]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.lmRole===role)));
  const c=$("#lmConfirm"); c.disabled=!role; c.className="lm-confirm"+(role?" "+role:"");
  c.textContent=role?`以${PEOPLE[role].label}身份继续`:"先选择一个角色";
  if(role) c.dataset.pick=role; else delete c.dataset.pick;
}
function lmPlay(){
  lmSelect(null);
  if(window.duoEntry?.take(()=>{lmPhase("choose");finishStartup();}))return;
  lmClear(); lmPhase("start");
  if(matchMedia("(prefers-reduced-motion: reduce)").matches){ lmPhase("choose"); finishStartup(); return; }
  lmReady().then(()=>{ if($("#lm").dataset.phase!=="start") return;
    lmTimers.push(setTimeout(()=>lmPhase("run"),60), setTimeout(()=>lmPhase("meet"),1840), setTimeout(()=>{lmPhase("choose");finishStartup();},2550)); });
}
/* 每次打开 App：已经选过身份的，播完跑近会合直接进主页（点任意处或"跳过"可提前进入）；首次打开播完弹出选择卡片 */
function openSplash(after){
  window.duoSetEntryCanvas(true);
  window.duoAnchorEntry();
  const pk=$("#pick"), lm=$("#lm");
  lm.classList.add("splash"); pk.classList.add("open"); document.body.style.overflow="hidden";
  let finishing=false;
  const done=async()=>{ if(!lm.classList.contains("splash")||finishing) return; finishing=true; lmClear(); lm.onclick=null;
    window.duoEntry?.waiting('正在打开…');
    const next=after?await after():null;
    lm.classList.remove("splash");
    if(next==="choose"){lmSelect(null);lmPhase("choose");finishStartup();return;}
    finishStartup(next!=="error");
    if(next!=="error"){
      // Prepare the complete page while entry still owns the root canvas.
      // The canvas and entry visibility are then committed in the same task.
      document.body.style.overflow="";
      scrollToPageStart();
      window.duoAnchorEntry();
      await Promise.race([window.duoPrepareLaunchScene?.()||window.duoLaunchSceneReady,new Promise(resolve=>setTimeout(resolve,1200))]);
      await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    }
    window.duoSetEntryCanvas(false);
    pk.classList.remove("open");
    window.duoBootTrace?.mark('home-visible');
    document.body.style.overflow="";
    lmPhase("choose");
  };
  lm.onclick=done;
  if(window.duoEntry?.take(done))return;
  lmClear(); lmPhase("start");
  if(matchMedia("(prefers-reduced-motion: reduce)").matches){ lmTimers.push(setTimeout(done,600)); return; }
  lmReady().then(()=>{ if(!lm.classList.contains("splash")||finishing) return;
    lmTimers.push(setTimeout(()=>lmPhase("run"),60), setTimeout(()=>lmPhase("meet"),1840), setTimeout(done,2400)); });
}
function openPicker(canCancel){
  window.duoSetEntryCanvas(true);
  window.duoAnchorEntry();
  $("#lm").classList.remove("splash"); $("#lm").onclick=null;
  $("#pick").classList.add("open"); $("[data-pick-cancel]").hidden=!canCancel; document.body.style.overflow="hidden";
  $("#entryIssue").hidden=true;
  if(canCancel){ lmClear(); lmSelect(me); lmPhase("choose"); } else lmPlay();
}
function showRoleChoice(){
  window.duoSetEntryCanvas(true);
  window.duoAnchorEntry();
  $("#lm").classList.remove("splash"); $("#lm").onclick=null;
  $("#pick").classList.add("open"); $("[data-pick-cancel]").hidden=true; document.body.style.overflow="hidden";
  $("#entryIssue").hidden=true;
  lmClear(); lmSelect(null); lmPhase("choose");
}
function genCode(){
  const a="ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789"; const r=new Uint32Array(14);
  (window.crypto||{getRandomValues:x=>x.map(()=>Math.random()*4e9)}).getRandomValues(r);
  return Array.from(r,x=>a[x%a.length]).join("");
}
function inviteLink(){ return location.origin+location.pathname; }
function showCodeShare(){ $("#codeShare").hidden=false; $("[data-code-copy]").hidden=false; $("[data-code-close]").hidden=false; }
let codeCreating=false, codeNextGoal=false;
function openCode(afterPick=false){
  codeCreating=false; codeNextGoal=afterPick;
  $("#codeInput").value=family; $("#codeDlg").classList.add("open"); document.body.style.overflow="hidden";
  $("#codeShare").hidden=!family; $("[data-code-copy]").hidden=!family; $("[data-code-close]").hidden=!family;
}
async function saveCode(){
  const v=$("#codeInput").value.trim();
  if(!/^[A-Za-z0-9]{8,40}$/.test(v)){ toast("口令需要 8 位以上，只能用字母和数字"); return; }
  const btn=$("[data-code-save]"); btn.disabled=true; btn.textContent="正在确认口令…";
  try{
    if(CLOUD && v!==family && !codeCreating){
      const data=await rpc("fl_pull",{p_family:v,p_since:ymd(addDays(new Date(),-120))});
      if(!(data?.checkins?.length || data?.measures?.length)){
        toast("没找到这个口令的同步记录，请检查口令，或让对方先保存目标",5000); return;
      }
    }
    const changed=v!==family; family=v; try{ localStorage.setItem(LS_FAMILY,family); }catch(_){}
    if(changed){
      Object.keys(store.checkins).forEach(id=>markDirty("c:"+id)); Object.keys(store.measures).forEach(id=>markDirty("m:"+id)); saveLocal();
    }
    syncState="idle"; await sync();
    if(codeNextGoal){
      codeNextGoal=false; $("#codeDlg").classList.remove("open"); document.body.style.overflow="";
      lastTab=null; render(); if(!goalOf(me)) openGoal();
    }else showCodeShare();
    toast("家庭口令已确认");
  }catch(e){ toast("无法验证口令，请检查网络后重试",5000); }
  finally{ btn.disabled=false; btn.textContent="确认口令并继续"; }
}
async function copyInvite(){
  const invite=`一起用 DuoFit 打卡：\n${inviteLink()}\n家庭口令：${family}\n打开链接后，选好角色并输入家庭口令。`;
  try{ await navigator.clipboard.writeText(invite); toast("邀请信息已复制"); }catch(e){ window.prompt("长按复制邀请信息",invite); }
}
/* ---------- 记录一顿吃了什么 ---------- */
let foodMeal=null, foodDate=null, foodOwner=null, foodBackfill=false, foodRows=[], foodRequest=0, foodBusy=false;
const QUICK={breakfast:["水煮蛋 2 个","纯牛奶 1 盒","全麦面包 2 片","燕麦片 40g","包子 2 个","无糖豆浆 1 杯"],
  lunch:["米饭 1 碗","番茄炒蛋 1 份","宫保鸡丁 1 份","炒青菜 1 份","黄焖鸡米饭","麻辣烫 1 份"],
  snack:["无糖酸奶 1 盒","苹果 1 个","香蕉 1 根","拿铁 1 杯","坚果 1 把","奶茶 1 杯"],
  dinner:["米饭 半碗","清蒸鱼 1 份","鸡胸肉 150g","蒜蓉西兰花 1 份","虾仁 150g","豆腐 1 块"]};
function openFood(m,date=ymd(new Date())){
  if(!MEALS.includes(m)||!canEditMealDate(me,date)||date!==ymd(new Date())&&tab!=="diet"){toast("这一天的记录不可修改");return;}
  foodRequest++; foodMeal=m; foodDate=date; foodOwner=me;
  const c=getCheckin(me,date),fd=c.meals?.[m]&&c.meals[m]!=="skip"?c.food?.[m]:null;
  foodBackfill=tab==="diet"&&!c.meals?.[m];
  $("#foodTitle").textContent=(date===ymd(new Date())?"":`${date.slice(5,7)}月${date.slice(8)}日 `)+MEAL_PLAN[me][m].t+"吃了什么";
  $("#foodLead").textContent=date===ymd(new Date())?"用一句话说就行，比如\"一碗米饭，宫保鸡丁半份，一杯拿铁\"。算出来的热量可以直接改。":"写下当天吃的食物和份量，核对热量后确认。历史餐次按当前计划的热量范围判断，可在保存后调整打卡状态。";
  $("#foodText").value=fd?.text||"";
  $("#foodChips").innerHTML=QUICK[m].map(x=>`<button type="button" data-chip="${esc(x)}">+ ${esc(x)}</button>`).join("");
  $("[data-food-clear]").hidden=!fd;
  foodRows = fd ? fd.items.map(i=>({...i})) : []; $("#foodNote").hidden=true;
  drawFood(); $("#foodDlg").classList.add("open"); document.body.style.overflow="hidden";
  setTimeout(()=>$("#foodText").focus(),50);
}
/* 估算过的原话记在本机，同一句话再算时直接用，不再调用 AI（最多记 60 条） */
let LS_AI="fatloss.aicache";
const aiCache={ get(t){ try{ return (JSON.parse(localStorage.getItem(LS_AI)||"{}"))[t]||null; }catch(e){ return null; } },
  set(t,v){ try{ const c=JSON.parse(localStorage.getItem(LS_AI)||"{}"); c[t]={...v,at:Date.now()};
    const keys=Object.keys(c).sort((a,b)=>c[b].at-c[a].at); keys.slice(60).forEach(k=>delete c[k]); localStorage.setItem(LS_AI,JSON.stringify(c)); }catch(e){} } };
function validMealResult(d){
  return !!d && Array.isArray(d.items) && d.items.length<=20 && (d.note==null || typeof d.note==="string") && d.items.every(i=>i && typeof i.name==="string" && i.name.trim() && typeof i.amount==="string" && (i.kcal===null || typeof i.kcal==="number" && Number.isFinite(i.kcal) && i.kcal>=0 && i.kcal<=3000));
}
function showAi(d){
  foodRows=d.items.map(i=>({n:i.name,q:i.amount,k:i.kcal,ai:true}));
  const note=$("#foodNote"); note.hidden=!d.note; note.textContent=d.note?"🤖 "+d.note:"";
  drawFood();
}
async function aiFood(){
  if(foodBusy)return;
  const text=$("#foodText").value.trim(); if(!text){ toast("先写一下吃了什么"); return; }
  clearTimeout(foodT);
  const hit=aiCache.get(text); if(validMealResult(hit)&&hit.items.length&&hit.items.every(i=>i.kcal!==null)){ showAi(hit); toast("这句话之前估算过，直接用了上次的结果"); return; }
  const request=++foodRequest,meal=foodMeal,person=me,sourceFamily=family,sourceCoach=privateCoach,owner=privateCoach?.userId(),date=foodDate;
  const sameIdentity=()=>sourceCoach===privateCoach&&owner===privateCoach?.userId()&&sourceFamily===family&&person===me;
  const current=()=>request===foodRequest&&sameIdentity()&&date===foodDate&&canEditMealDate(person,date)&&meal===foodMeal&&$("#foodDlg").classList.contains("open")&&$("#foodText").value.trim()===text;
  const btn=$("[data-food-ai]"); foodBusy=true;btn.disabled=true; const t0=Date.now();
  const tick=()=>{ if(current())btn.textContent=`🤖 正在估算… ${Math.round((Date.now()-t0)/1000)}s`; }; tick(); const tk=setInterval(tick,1000);
  try{
    let d;
    if(privateCoach?.active){d=await privateCoach.estimateMeal({family:sourceFamily,text});}
    else {
      if(!Object.keys(store.checkins).length && !Object.keys(store.measures).length){ toast("先设定目标或打一次卡，完成同步后再试 AI 估算",5000); return; }
      if(dirty.length){
        await sync();
        if(syncState!=="ok"){ toast("打卡记录还没同步成功，请联网后再试 AI 估算",5000); return; }
      }
      const headers={"Content-Type":"application/json","apikey":SUPABASE_KEY};
      if(!SUPABASE_KEY.startsWith("sb_")) headers["Authorization"]="Bearer "+SUPABASE_KEY;
      const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),90000);
      try{
        const r=await fetch(SUPABASE_URL.replace(/\/$/,"")+"/functions/v1/meal-kcal"+(AI_REGION?"?forceFunctionRegion="+encodeURIComponent(AI_REGION):""),{method:"POST",headers,body:JSON.stringify({family:sourceFamily,text}),signal:ctl.signal});
        d=await r.json();if(!r.ok)throw Object.assign(new Error(d.error||"upstream"),{code:d.error,status:r.status});
      }finally{clearTimeout(timer);}
    }
    if(!sameIdentity())return;
    if(!validMealResult(d))throw Object.assign(new Error("no_output"),{code:"no_output"});
    if(!d.items.length){if(current())toast(d.note||"这段描述里没有识别到食物，请补充食物名称和份量");return;}
    if(d.items.every(i=>i.kcal!==null))aiCache.set(text,{items:d.items,note:d.note||""}); if(current())showAi(d);
  }catch(e){
    if(!current())return;
    const known={daily_limit:"今天 AI 估算次数用完了，明天再试",unknown_family:"家庭档案还没有同步，请完成目标设定后重试",family_check_failed:"AI 服务暂时读不到家庭档案，请稍后重试",auth_unavailable:"登录验证服务暂时不可用，请稍后重试",wrong_family:"当前身份与家庭档案不匹配，请重新连接档案",invalid_session:"登录验证失败，请重新连接档案后再试",session_changed:"本机身份已切换，请重新打开这一餐",busy:"AI 有点忙，稍后再试",bad_key:"AI 服务配置或余额有问题，请检查后台",unreachable:"AI 服务连接失败，可以先手动填热量",quota_check_failed:"AI 次数检查暂时失败，请稍后重试",model_unavailable:"当前 AI 模型暂时不可用，请检查后台配置",no_output:"AI 回复格式异常，未能完成估算；原文已保留，可重试或手动填热量",refused:"AI 未处理这段描述，可以补充食物名称和份量",bad_family:"家庭口令格式不正确，请重新设置",upstream:"AI 上游服务暂时不可用，请稍后重试",ai_timeout:"AI 估算等待超时，可稍后重试或先手动填写",request_timeout:"AI 估算等待超时，可稍后重试或先手动填写",ai_not_configured:"AI 服务尚未配置，请检查后台",server_not_configured:"AI 服务尚未配置，请检查后台"};
    toast(known[e.code||e.message]||(e.name==="AbortError"?known.ai_timeout:"AI 连接失败，原文已保留，可以先手动填热量"),7000);
  }
  finally{ clearInterval(tk); foodBusy=false;btn.disabled=false; btn.textContent="🤖 让 AI 估算这一顿"; }
}
function closeFood(){ foodRequest++;clearTimeout(foodT);foodDate=null;foodOwner=null;foodBackfill=false;if(document.activeElement) document.activeElement.blur(); $("#foodDlg").classList.remove("open"); document.body.style.overflow=""; }
function foodStatus(total){ const hi=mealRange(menuFor(me)[foodMeal])[1]; return total>hi*1.1 ? ["over",`比计划多约 ${total-hi} kcal，记为"吃多了"`] : ["plan",`在计划范围内（上限约 ${hi}），记为"按计划吃了"`]; }
function drawFood(){
  const aiBtn=$("[data-food-ai]"); aiBtn.disabled=foodBusy;aiBtn.hidden=!(AI_KCAL && CLOUD && family); aiBtn.classList.toggle("hot", foodRows.some(r=>r.k==null));
  $("#foodRes").innerHTML=foodRows.map((r,i)=>`<li class="${r.k==null?"miss":""}"><div>${esc(r.n)}${r.ai?`<span class="ai">AI</span>`:""}<small>${r.k==null?"没认出来，填个大概热量，或者换个说法":esc(r.q)}</small></div>
    <input type="number" inputmode="numeric" min="0" max="3000" step="5" value="${r.k==null?"":r.k}" data-fk="${i}" aria-label="${esc(r.n)}的热量" placeholder="kcal">
    <button class="x" type="button" data-fx="${i}" aria-label="去掉${esc(r.n)}">×</button></li>`).join("");
  drawFoodTotal();
}
function drawFoodTotal(){
  const total=foodRows.reduce((a,r)=>a+(r.k||0),0), missing=foodRows.some(r=>r.k==null);
  const [st,txt]=missing ? ["missing","还有食物未估算，暂不能判断是否在计划内"] : foodStatus(total);
  $("#foodTotal").innerHTML = foodRows.length ? `<span>${missing?"已估算部分约":"这顿一共约"} <b>${total}</b> kcal</span><span class="st ${st==="over"?"over":missing?"pending":""}">${missing?txt:txt.split("，")[0]}</span>` : "";
  $("[data-food-save]").disabled = !foodRows.length || missing;
  $("[data-food-save]").textContent = missing ? "还有没认出的，填上热量再保存" : foodBackfill?"确认补打卡":"保存并打卡";
}
let foodT=null;
function onFoodText(){ foodRequest++;clearTimeout(foodT); foodT=setTimeout(()=>{ foodRows=parseMeal($("#foodText").value); drawFood(); },250); }
function saveFood(){
  if(foodOwner!==me||!canEditMealDate(me,foodDate)||!foodRows.length||foodRows.some(r=>r.k==null||!Number.isFinite(r.k)))return;
  const total=foodRows.reduce((a,r)=>a+(r.k||0),0); const [st]=foodStatus(total);
  const date=foodDate,c=JSON.parse(JSON.stringify(getCheckin(me,date)));
  c.food=c.food||{}; c.food[foodMeal]={text:$("#foodText").value.trim().slice(0,200), items:foodRows.map(r=>({n:r.n.slice(0,20),q:r.q,k:r.k,...(r.ai?{ai:1}:{})})), kcal:total};
  c.meals=c.meals||{}; const today=date===ymd(new Date()),was=today&&dayDone(me,new Date()); c.meals[foodMeal]=st;
  putCheckin(c); closeFood();
  if(!today) toast(shortDay(date)+"的"+MEAL_NAMES[foodMeal]+"已保存");
  else if(!was && dayDone(me,new Date())) react("day-done","今天全部完成啦",`这顿约 ${total} kcal，今天的打卡都满了`,true);
  else if(st==="over") react("meal",`这顿约 ${total} kcal，吃多了一点`,"没关系，下一顿正常吃就好");
  else react("meal",`这顿约 ${total} kcal ✨`,"在计划范围内，已打卡");
}
function clearFood(){
  if(foodOwner!==me||!canEditMealDate(me,foodDate))return;
  const date=foodDate,c=JSON.parse(JSON.stringify(getCheckin(me,date)));
  if(c.food){ delete c.food[foodMeal]; if(!Object.keys(c.food).length) delete c.food; }
  putCheckin(c); closeFood(); toast("已删除食物，打卡状态保留");
}
function openGoal(){
  const f=$("#goalForm"); const g=goalOf(me)||{};
  f.height.value=g.height||""; f.age.value=g.age||""; f.start.value=latestWeight(me)||g.start||""; f.target.value=g.target||"";
  f.querySelector(`[name=pace][value="${g.pace||"gentle"}"]`).checked=true;
  goalPreview(); $("#goalDlg").classList.add("open"); document.body.style.overflow="hidden";
}
function readGoalForm(){
  const f=$("#goalForm"); const n=k=>Number(f[k].value);
  return {height:n("height"),age:n("age"),start:n("start"),target:n("target"),pace:f.querySelector("[name=pace]:checked").value};
}
/* 返回 [可以保存, 预览文字] */
function goalCheck(v){
  if(!(v.height>=130&&v.height<=210&&v.age>=18&&v.age<=80&&v.start>=30&&v.target>=30)) return [false,"填完上面四项，这里会显示每天吃多少"];
  const floor=minHealthy(v.height);
  if(v.target<floor) return [false,`这个目标低于健康体重下限（BMI 18.5，约 ${floor} kg），换一个高一点的目标吧`];
  const p=calcPlan(me,{...v,adj:0,level:0},v.start);
  if(p.maintain) return [true,`目标不低于当前体重，按<b>维持</b>来安排：每天约 <b>${p.kcal} kcal</b>，蛋白质约 ${p.protein}g`];
  return [true,`每天约 <b>${p.kcal} kcal</b>（消耗约 ${p.tdee}），每周约 −${p.perWeek} kg，大约 <b>${p.weeks} 周</b>到目标；蛋白质约 ${p.protein}g`];
}
function goalPreview(){ const [ok,t]=goalCheck(readGoalForm()); const el=$("#goalPrev"); el.innerHTML=t; el.className="gprev"+(ok||t.startsWith("填完")?"":" bad"); }
function closeGoal(){ if(document.activeElement) document.activeElement.blur(); $("#goalDlg").classList.remove("open"); document.body.style.overflow=""; }
function suggCard(){
  const list=suggestionsFor(me); if(!list.length) return "";
  const wk=ymd(new Date()).slice(0,4)+"-"+isoWeek(new Date());
  try{ if(localStorage.getItem("fatloss.sugg."+me)===wk+goalOf(me).at) return ""; }catch(e){}
  return `<div class="sugg"><div class="sh"><img src="${mood(me,list.some(x=>x.k==="adj"&&x.v<0)?"weigh":"happy")}" alt=""><div><b>这周的调整建议</b><small>根据最近的体重和训练情况</small></div></div>
    <ul>${list.map(x=>`<li><b>${esc(x.t)}</b><small>${esc(x.d)}</small></li>`).join("")}</ul>
    <div class="acts"><button class="btn ghost" data-sugg="skip">先不用</button><button class="btn primary" data-sugg="ok">按建议调整</button></div></div>`;
}
function goalCard(){
  const p=planFor(me);
  if(privateCoach?.active)return `<div class="goal-card"><div class="gh"><h4>我的目标 · ${esc(privateCoach.goalTitle())}</h4><button class="linkbtn" data-open-goal>修改</button></div><p>想改善：${esc(privateCoach.profile?.focus?.join("、")||"全身")}${privateCoach.profile?.target?` · 期待 ${esc(privateCoach.profile.target)} kg`:""}</p><p>身体状态与计划只有你可见。每周第一天确认后可以调整。</p></div>`;
  if(!p) return `<div class="goal-cta"><img src="${mood(me,"weigh")}" alt=""><div><b>还没设定目标</b><small>填身高、体重和目标，按你的情况安排每天吃多少、怎么练</small></div><button class="btn primary" data-open-goal>去设定</button></div>`;
  const pct = p.g.start>p.g.target ? Math.max(0,Math.min(100,Math.round((p.g.start-p.w)/(p.g.start-p.g.target)*100))) : 100;
  const R=roundsFor(me==="hus"?"A":"W",me);
  return `<div class="goal-card"><div class="gh"><h4>${icon("goal")} 我的目标 ${p.g.target} kg</h4><button class="linkbtn" style="padding:0" data-open-goal>修改</button></div>
    <p>${p.maintain?"已经到目标附近，按维持来安排，保持住就好":`还差 ${p.toGo} kg · 按计划约 ${p.weeks} 周`} · ${PACE[p.g.pace||"gentle"].label}速度</p>
    <div class="goal-bar"><i style="width:${pct}%"></i></div>
    <div class="gl"><div><b>${p.kcal}</b>每天 kcal</div><div><b>${p.protein}g</b>蛋白质</div><div><b>${R} 轮</b>每次训练${p.g.cardio?" + 快走":""}</div></div>
    <p>每周日量完体重后，会根据趋势给调整建议，点确认才会改。</p></div>`;
}
function closePicker(){ lmClear(); window.duoSetEntryCanvas(false); $("#pick").classList.remove("open"); document.body.style.overflow=""; restoreHeroScrollStart(); }

/* Reserve the fixed navigation's complete height, including the iPhone safe area. */
function initTabBarSpace(){
  const bar=$(".tabs"); if(!bar) return;
  const update=()=>{
    const height=Math.ceil(bar.getBoundingClientRect().height);
    document.documentElement.style.setProperty("--tab-bar-height",height+"px");
  };
  update();
  if(typeof ResizeObserver!=="undefined") new ResizeObserver(update).observe(bar);
  else window.addEventListener("resize",update);
}

let displayedCalendarDay=ymd(new Date());
function refreshCalendarDay(){
  const date=ymd(new Date());if(date===displayedCalendarDay)return false;
  displayedCalendarDay=date;if(me){lastTab=null;render();}return true;
}

/* ---------- boot ---------- */
startupPending=true;
initTabBarSpace();
$("#goalForm").addEventListener("input",goalPreview);
$("#codeInput").addEventListener("input",()=>{ codeCreating=false; });
$("#foodText").addEventListener("input",onFoodText);
$("#foodRes").addEventListener("input",e=>{ const i=e.target.dataset.fk; if(i==null) return; const v=e.target.value;
  foodRows[+i].k = v===""?null:Math.max(0,Math.round(Number(v))); drawFoodTotal(); });
$("#goalForm").addEventListener("submit",e=>{
  e.preventDefault(); const v=readGoalForm(); const [ok]=goalCheck(v); if(!ok){ goalPreview(); return; }
  const today=ymd(new Date()); const ex=store.measures[me+"_"+today]||{};
  const old=goalOf(me)||{};
  putMeasure({...ex, person:me, date:today, weight:v.start, goal:{height:v.height,age:v.age,start:v.start,target:v.target,pace:v.pace,adj:0,level:old.level||0,cardio:!!old.cardio,mode:null,at:today}});
  menuCache={}; closeGoal(); lastTab=null; render(); react("weigh","目标已保存","今天吃什么已经按你的目标调好了");
});

if(CLOUD){
  privateCoach=new window.DuoCoach({
    pageDiagnostics:pageViewportDiagnostics,
    family:()=>family,
    initialMeasures:person=>Object.fromEntries(Object.entries(store.measures).filter(([,body])=>body.person===person)),
    needsRole:()=>{if(!$("#pick").classList.contains("open"))openPicker(false);},
    showRoleChoice:()=>showRoleChoice(),
    hideEntry:()=>closePicker(),
    entryError:msg=>{const issue=$("#entryIssue");issue.textContent=msg;issue.hidden=false;},
    setIdentity:(person,pairedFamily,uid)=>{
      me=person; viewP=person; family=pairedFamily;
      const nextData="duofit.private."+uid, nextDirty="duofit.private.dirty."+uid;
      if(LS_DATA===nextData) return;
      const own={checkins:{},measures:{}};
      Object.entries(store.checkins).forEach(([id,b])=>{if(b.person===me) own.checkins[id]=b;});
      Object.entries(store.measures).forEach(([id,b])=>{if(b.person===me) own.measures[id]=b;});
      let cached={}; try{cached=JSON.parse(localStorage.getItem(nextData)||"{}");}catch(_){}
      Object.entries(cached.checkins||{}).forEach(([id,b])=>{if(b.person===me) own.checkins[id]=b;});
      Object.entries(cached.measures||{}).forEach(([id,b])=>{if(b.person===me) own.measures[id]=b;});
      let cachedDirty=[];try{cachedDirty=JSON.parse(localStorage.getItem(nextDirty)||"[]");}catch(_){}
      dirty=[...new Set([...dirty,...cachedDirty])].filter(k=>{const id=k.slice(2);return k[0]==="c"?!!own.checkins[id]:!!own.measures[id];});
      store=own; LS_DATA=nextData; LS_DIRTY=nextDirty; LS_AI="duofit.private.aicache."+uid;
      try{localStorage.setItem(LS_ME,me);localStorage.setItem(LS_FAMILY,family);localStorage.removeItem("fatloss.local");localStorage.removeItem("fatloss.dirty");localStorage.removeItem("fatloss.aicache");}catch(_){}
      saveLocal();
    },
    setStore:data=>{const next={checkins:data.checkins||{},measures:data.measures||{}};dirty.forEach(k=>{const id=k.slice(2),src=k[0]==="c"?store.checkins:store.measures,dst=k[0]==="c"?next.checkins:next.measures;if(src[id])dst[id]=src[id];});store=next;saveLocal();},
    clearDirty:ackDirty,
    getSyncData:()=>({store,dirty}),
    requestSync:reason=>{setTimeout(()=>sync(reason),0);},
    setSync:v=>{syncState=v;if(v==="ok")lastSync=new Date();renderSync();},
    getCheckin:date=>getCheckin(me,date),putCheckin:b=>putCheckin(b),renderHistory:()=>renderRecordData(),render:()=>{lastTab=null;render();},
    clearIdentity:()=>{store={checkins:{},measures:{}};dirty=[];LS_DATA="fatloss.local";LS_DIRTY="fatloss.dirty";LS_AI="fatloss.aicache";$("#view").innerHTML="";},
    saveLegacyGoal:p=>{const date=ymd(new Date()),ex=store.measures[me+"_"+date]||{},old=goalOf(me)||{};
      const start=Number(p.weight),floor=minHealthy(Number(p.height)),target=p.target?Number(p.target):(p.goals.includes("减脂")?Math.max(floor,Math.round(start*.95*10)/10):start);
      putMeasure({...ex,person:me,date,weight:start,goal:{height:Number(p.height),age:Number(p.age),start,target,pace:"gentle",adj:0,level:old.level||0,cardio:false,mode:p.target?null:"maintain",at:date,goals:p.goals,focus:p.focus}});
      menuCache={};}
  });
  let savedCoachSession=false;try{savedCoachSession=!!(localStorage.getItem("duofit.auth.v1")||localStorage.getItem("duofit.paired.v1"));}catch(_){}
  if(savedCoachSession)openSplash(async()=>{const status=await coachReady.catch(()=>"error");return status==="error"?"error":privateCoach.active?"home":"choose";});else openPicker(false);
  // Let the startup screen paint before restoring local data or doing cloud work.
  coachReady=new Promise(resolve=>requestAnimationFrame(()=>setTimeout(resolve,0))).then(()=>privateCoach.start());privateCoach.ready=coachReady;
  setInterval(()=>{if(document.visibilityState==="visible"){refreshCalendarDay();sync("poll");}},30000);
  document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"){refreshCalendarDay();sync("foreground");}});
  window.addEventListener("online",()=>sync("online"));
}else if(storedMe!=="hus" && storedMe!=="wife") openPicker(false);
else openSplash();
})();

};
/* application loader: dependencies are deferred, styles are nonblocking */
if(window.duoAppStylesReady)window.duoAppStylesReady.then(()=>{if(window.duoBootFailure)return;try{window.duoStartApp();}catch(error){window.duoEntry.fail('app');console.error(error);}},()=>window.duoEntry.fail('style'));
