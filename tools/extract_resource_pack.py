#!/usr/bin/env python3
from pathlib import Path
from PIL import Image
import argparse, json, hashlib

PANELS={"terrain_tiles":[7,372,960,510],"terrain_variants":[7,511,960,665],"foliage":[7,667,390,884],"rocks_cliffs":[392,667,660,884],"buildings":[662,667,958,884],"props":[960,667,1220,884],"decals":[1221,667,1528,884],"water":[7,885,445,1017],"lod_variants":[447,885,1087,1017]}
COLS={"grass":[1034,1103],"soil":[1112,1182],"rock":[1191,1261],"cliff":[1271,1341],"path":[1350,1421],"water":[1430,1501]}
ROWS={"albedo":[420,479],"normal":[480,536],"roughness":[538,595],"height_ao":[597,652]}
OBJECTS={
"foliage/tree_broadleaf_green_01":[14,694,83,784],"foliage/tree_cherry_01":[82,690,148,782],"foliage/tree_pine_01":[145,691,206,783],"foliage/tree_pine_02":[196,691,250,783],"foliage/tree_broadleaf_yellow_01":[245,690,318,785],
"rocks/rock_cluster_01":[401,700,466,771],"rocks/rock_cluster_02":[461,698,527,771],"rocks/cliff_pillar_01":[528,691,589,777],"rocks/cliff_arch_01":[586,763,653,873],
"buildings/house_01":[669,692,747,778],"buildings/house_02":[744,692,824,778],"buildings/watchtower_01":[824,689,891,779],"buildings/market_01":[670,778,752,869],"buildings/bridge_01":[749,782,840,871],"buildings/gate_01":[839,779,949,873],
"props/crates_01":[969,696,1018,751],"props/signpost_01":[1015,694,1054,754],"props/barrels_01":[1050,697,1095,753],"props/cart_01":[1090,696,1144,757],"props/stall_01":[966,757,1040,820],"props/table_01":[1040,756,1094,819],"props/canopy_01":[1093,754,1161,821],"props/banners_01":[1139,696,1210,873],
"decals/grass_patch_01":[1230,695,1295,755],"decals/stone_patch_01":[1291,694,1357,755],"decals/flower_patch_01":[1355,693,1420,757],"decals/flower_patch_02":[1417,691,1518,759],"decals/reeds_01":[1228,758,1298,827],"decals/lilies_01":[1295,758,1361,828],"decals/ground_detail_01":[1357,757,1426,827],"decals/autumn_detail_01":[1422,757,1518,872]}

def save_crop(im, box, path, alpha=False):
    c=im.crop(tuple(box)).convert("RGBA")
    if alpha:
        px=c.load()
        for y in range(c.height):
            for x in range(c.width):
                r,g,b,a=px[x,y]; m=max(r,g,b)
                if m<34: px[x,y]=(r,g,b,0)
                elif m<52: px[x,y]=(r,g,b,int(a*(m-34)/18))
    path.parent.mkdir(parents=True,exist_ok=True); c.save(path)

def main():
    ap=argparse.ArgumentParser(); ap.add_argument("sheet"); ap.add_argument("--out",default="assets/packs/forest_village_01/reference")
    a=ap.parse_args(); src=Path(a.sheet); out=Path(a.out); im=Image.open(src)
    if im.size!=(1536,1024): raise SystemExit(f"expected 1536x1024, got {im.size}")
    for n,b in PANELS.items(): save_crop(im,b,out/"panels"/f"{n}.png")
    for mat,(x1,x2) in COLS.items():
        for ch,(y1,y2) in ROWS.items(): save_crop(im,[x1,y1,x2,y2],out/"materials"/mat/f"{ch}.png")
    for n,b in OBJECTS.items(): save_crop(im,b,out/"objects"/f"{n}.png",True)
    provenance={"source_sha256":hashlib.sha256(src.read_bytes()).hexdigest(),"source_size":list(im.size),"panels":PANELS,"materials":{"columns":COLS,"rows":ROWS},"objects":OBJECTS}
    (out/"provenance.json").write_text(json.dumps(provenance,indent=2),encoding="utf-8")
if __name__=="__main__": main()
