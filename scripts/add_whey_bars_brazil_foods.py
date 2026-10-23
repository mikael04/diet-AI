#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Adiciona Wheys e Barras de Proteína do mercado brasileiro, além de mais frutas,
legumes, verduras e comidas típicas brasileiras na base taco_database.json.
"""
import json
import unicodedata

def normalize_text(text: str) -> str:
    """Remove acentos e caracteres especiais para busca fonética."""
    return "".join(
        c for c in unicodedata.normalize("NFD", text)
        if unicodedata.category(c) != "Mn"
    ).lower()

new_foods = [
    # ==========================================
    # 1. WHEYS E BEBIDAS PROTEICAS NO BRASIL
    # ==========================================
    {
        "name": "100% Whey Concentrado Growth Supplements",
        "category": "Suplementos",
        "kcal_per_100g": 400.0,
        "protein_per_100g": 70.0,
        "carbs_per_100g": 15.0,
        "fat_per_100g": 6.7,
        "fiber_per_100g": 0.0,
        "default_unit": "scoop",
        "grams_per_unit": 30.0,
        "synonyms": "whey growth,whey concentrado growth,growth whey,100% whey growth,growth supplements whey,whey protein growth"
    },
    {
        "name": "Whey Protein Isolado 90% Growth Supplements",
        "category": "Suplementos",
        "kcal_per_100g": 360.0,
        "protein_per_100g": 90.0,
        "carbs_per_100g": 0.0,
        "fat_per_100g": 0.0,
        "fiber_per_100g": 0.0,
        "default_unit": "scoop",
        "grams_per_unit": 30.0,
        "synonyms": "whey isolado growth,growth isolado,growth whey isolado 90%,iso whey growth,whey 90% growth"
    },
    {
        "name": "100% Whey Max Titanium",
        "category": "Suplementos",
        "kcal_per_100g": 403.0,
        "protein_per_100g": 70.0,
        "carbs_per_100g": 15.0,
        "fat_per_100g": 7.0,
        "fiber_per_100g": 0.0,
        "default_unit": "scoop",
        "grams_per_unit": 30.0,
        "synonyms": "whey max titanium,max titanium whey,100% whey max,whey max,max titanium concentrado"
    },
    {
        "name": "Top Whey 3D Max Titanium",
        "category": "Suplementos",
        "kcal_per_100g": 406.0,
        "protein_per_100g": 78.1,
        "carbs_per_100g": 11.9,
        "fat_per_100g": 5.0,
        "fiber_per_100g": 0.0,
        "default_unit": "scoop",
        "grams_per_unit": 32.0,
        "synonyms": "top whey 3d,top whey max titanium,whey 3d max,top whey,max titanium 3d"
    },
    {
        "name": "Whey Protein Concentrado Dux Nutrition",
        "category": "Suplementos",
        "kcal_per_100g": 403.0,
        "protein_per_100g": 66.7,
        "carbs_per_100g": 18.3,
        "fat_per_100g": 7.3,
        "fiber_per_100g": 0.0,
        "default_unit": "scoop",
        "grams_per_unit": 30.0,
        "synonyms": "whey dux,dux whey concentrado,dux nutrition whey,whey protein dux,dux concentrado"
    },
    {
        "name": "Whey Protein Isolado Dux Nutrition",
        "category": "Suplementos",
        "kcal_per_100g": 367.0,
        "protein_per_100g": 80.0,
        "carbs_per_100g": 6.0,
        "fat_per_100g": 2.3,
        "fiber_per_100g": 0.0,
        "default_unit": "scoop",
        "grams_per_unit": 30.0,
        "synonyms": "whey isolado dux,dux isolado,dux whey protein isolado,dux nutrition isolado"
    },
    {
        "name": "100% Pure Whey IntegralMedica",
        "category": "Suplementos",
        "kcal_per_100g": 407.0,
        "protein_per_100g": 70.0,
        "carbs_per_100g": 14.3,
        "fat_per_100g": 7.3,
        "fiber_per_100g": 0.0,
        "default_unit": "scoop",
        "grams_per_unit": 30.0,
        "synonyms": "whey integralmedica,100% pure whey integralmedica,pure whey integralmedica,whey integral medica"
    },
    {
        "name": "Iso Triple Zero IntegralMedica",
        "category": "Suplementos",
        "kcal_per_100g": 347.0,
        "protein_per_100g": 86.7,
        "carbs_per_100g": 0.0,
        "fat_per_100g": 0.0,
        "fiber_per_100g": 0.0,
        "default_unit": "scoop",
        "grams_per_unit": 30.0,
        "synonyms": "iso triple zero,triple zero integralmedica,whey isolado integralmedica,triple zero"
    },
    {
        "name": "100% Pure Whey Probiótica",
        "category": "Suplementos",
        "kcal_per_100g": 400.0,
        "protein_per_100g": 76.7,
        "carbs_per_100g": 10.7,
        "fat_per_100g": 5.3,
        "fiber_per_100g": 0.0,
        "default_unit": "scoop",
        "grams_per_unit": 30.0,
        "synonyms": "whey probiotica,whey probiótica,100% pure whey probiotica,probiotica whey"
    },
    {
        "name": "YoPRO Bebida Láctea 15g Danone",
        "category": "Suplementos",
        "kcal_per_100g": 59.2,
        "protein_per_100g": 6.0,
        "carbs_per_100g": 6.8,
        "fat_per_100g": 0.9,
        "fiber_per_100g": 0.4,
        "default_unit": "garrafa",
        "grams_per_unit": 250.0,
        "synonyms": "yopro,yopro 15g,yo pro,iogurte yopro,bebida lactea yopro,danone yopro,yopro chocolate,yopro morango"
    },
    {
        "name": "YoPRO Bebida Láctea 25g Danone",
        "category": "Suplementos",
        "kcal_per_100g": 64.0,
        "protein_per_100g": 10.0,
        "carbs_per_100g": 4.4,
        "fat_per_100g": 0.7,
        "fiber_per_100g": 0.4,
        "default_unit": "garrafa",
        "grams_per_unit": 250.0,
        "synonyms": "yopro 25g,yo pro 25g,yopro alta proteina,danone yopro 25g"
    },
    {
        "name": "Piracanjuba Whey 15g ProForce",
        "category": "Suplementos",
        "kcal_per_100g": 58.0,
        "protein_per_100g": 6.0,
        "carbs_per_100g": 6.4,
        "fat_per_100g": 0.8,
        "fiber_per_100g": 0.0,
        "default_unit": "caixinha",
        "grams_per_unit": 250.0,
        "synonyms": "piracanjuba whey,piracanjuba 15g,piracanjuba proforce,whey piracanjuba,bebida piracanjuba whey"
    },
    {
        "name": "Piracanjuba Whey 23g ProForce",
        "category": "Suplementos",
        "kcal_per_100g": 74.0,
        "protein_per_100g": 9.2,
        "carbs_per_100g": 8.0,
        "fat_per_100g": 0.4,
        "fiber_per_100g": 0.0,
        "default_unit": "caixinha",
        "grams_per_unit": 250.0,
        "synonyms": "piracanjuba whey 23g,piracanjuba 23g,whey 23g piracanjuba,piracanjuba proforce 23g"
    },
    {
        "name": "Italac Whey 15g Bebida Láctea",
        "category": "Suplementos",
        "kcal_per_100g": 56.0,
        "protein_per_100g": 6.0,
        "carbs_per_100g": 6.4,
        "fat_per_100g": 0.6,
        "fiber_per_100g": 0.0,
        "default_unit": "caixinha",
        "grams_per_unit": 250.0,
        "synonyms": "italac whey,whey italac,italac 15g,bebida italac whey"
    },

    # ==========================================
    # 2. BARRAS DE PROTEÍNA VENDIDAS NO BRASIL
    # ==========================================
    {
        "name": "Bold Bar Barra de Proteína 60g",
        "category": "Suplementos",
        "kcal_per_100g": 383.0,
        "protein_per_100g": 35.0,
        "carbs_per_100g": 31.7,
        "fat_per_100g": 15.0,
        "fiber_per_100g": 6.7,
        "default_unit": "unidade",
        "grams_per_unit": 60.0,
        "synonyms": "bold bar,barra bold,bold snack,bold barra de proteina,bold barra,bold doce de leite,bold cookies"
    },
    {
        "name": "Bold Thin Barra de Proteína 40g",
        "category": "Suplementos",
        "kcal_per_100g": 387.0,
        "protein_per_100g": 30.0,
        "carbs_per_100g": 32.5,
        "fat_per_100g": 16.2,
        "fiber_per_100g": 7.5,
        "default_unit": "unidade",
        "grams_per_unit": 40.0,
        "synonyms": "bold thin,barra bold thin,bold fininha,bold thin barra"
    },
    {
        "name": "Power Protein Bar Max Titanium 90g",
        "category": "Suplementos",
        "kcal_per_100g": 400.0,
        "protein_per_100g": 33.3,
        "carbs_per_100g": 33.3,
        "fat_per_100g": 18.3,
        "fiber_per_100g": 5.0,
        "default_unit": "unidade",
        "grams_per_unit": 90.0,
        "synonyms": "power protein bar,barra power protein max,barra max titanium 90g,power bar max,max titanium protein bar"
    },
    {
        "name": "Darkness Monster Bar / Dark Bar IntegralMedica 90g",
        "category": "Suplementos",
        "kcal_per_100g": 383.0,
        "protein_per_100g": 31.1,
        "carbs_per_100g": 35.6,
        "fat_per_100g": 16.7,
        "fiber_per_100g": 4.4,
        "default_unit": "unidade",
        "grams_per_unit": 90.0,
        "synonyms": "dark bar,darkness bar,darkness monster bar,barra integralmedica 90g,monster bar,dark bar 90g"
    },
    {
        "name": "Barra de Proteína Growth Supplements 40g",
        "category": "Suplementos",
        "kcal_per_100g": 350.0,
        "protein_per_100g": 30.0,
        "carbs_per_100g": 30.0,
        "fat_per_100g": 11.2,
        "fiber_per_100g": 8.8,
        "default_unit": "unidade",
        "grams_per_unit": 40.0,
        "synonyms": "barra growth,protein bar growth,barra de proteina growth,growth bar,barra proteica growth"
    },
    {
        "name": "Dux Protein Bar 50g",
        "category": "Suplementos",
        "kcal_per_100g": 370.0,
        "protein_per_100g": 30.0,
        "carbs_per_100g": 30.0,
        "fat_per_100g": 15.0,
        "fiber_per_100g": 8.0,
        "default_unit": "unidade",
        "grams_per_unit": 50.0,
        "synonyms": "dux bar,barra dux,dux protein bar,barra de proteina dux,barra dux nutrition"
    },
    {
        "name": "Crisp Bar IntegralMedica 45g",
        "category": "Suplementos",
        "kcal_per_100g": 367.0,
        "protein_per_100g": 28.9,
        "carbs_per_100g": 35.6,
        "fat_per_100g": 12.2,
        "fiber_per_100g": 5.6,
        "default_unit": "unidade",
        "grams_per_unit": 45.0,
        "synonyms": "crisp bar,crisp bar integralmedica,barra crisp,integralmedica crisp bar"
    },
    {
        "name": "Choco Whey Bar Probiótica 40g",
        "category": "Suplementos",
        "kcal_per_100g": 362.0,
        "protein_per_100g": 30.0,
        "carbs_per_100g": 35.0,
        "fat_per_100g": 12.0,
        "fiber_per_100g": 5.0,
        "default_unit": "unidade",
        "grams_per_unit": 40.0,
        "synonyms": "choco whey bar,barra probiotica,probiotica protein bar,choco whey probiotica"
    },
    {
        "name": "Nutry Protein Bar 40g",
        "category": "Suplementos",
        "kcal_per_100g": 350.0,
        "protein_per_100g": 25.0,
        "carbs_per_100g": 37.5,
        "fat_per_100g": 10.0,
        "fiber_per_100g": 6.2,
        "default_unit": "unidade",
        "grams_per_unit": 40.0,
        "synonyms": "barra nutry,nutry protein,nutry protein bar,barra de cereal nutry protein,nutry barra"
    },

    # ==========================================
    # 3. FRUTAS BRASILEIRAS ADICIONAIS
    # ==========================================
    {
        "name": "Jabuticaba crua",
        "category": "Frutas",
        "kcal_per_100g": 58.0,
        "protein_per_100g": 0.6,
        "carbs_per_100g": 15.3,
        "fat_per_100g": 0.1,
        "fiber_per_100g": 2.3,
        "default_unit": "unidade",
        "grams_per_unit": 5.0,
        "synonyms": "jabuticaba,jabuticabas,jaboticaba,fruta brasileira"
    },
    {
        "name": "Pitanga crua",
        "category": "Frutas",
        "kcal_per_100g": 41.0,
        "protein_per_100g": 0.9,
        "carbs_per_100g": 10.2,
        "fat_per_100g": 0.2,
        "fiber_per_100g": 3.2,
        "default_unit": "unidade",
        "grams_per_unit": 8.0,
        "synonyms": "pitanga,pitangas,fruta pitanga"
    },
    {
        "name": "Cupuaçu polpa fresca",
        "category": "Frutas",
        "kcal_per_100g": 49.0,
        "protein_per_100g": 1.2,
        "carbs_per_100g": 11.4,
        "fat_per_100g": 1.0,
        "fiber_per_100g": 1.6,
        "default_unit": "colher de sopa",
        "grams_per_unit": 25.0,
        "synonyms": "cupuacu,cupuaçu,polpa de cupuacu,polpa de cupuaçu,suco de cupuaçu"
    },
    {
        "name": "Graviola crua",
        "category": "Frutas",
        "kcal_per_100g": 62.0,
        "protein_per_100g": 1.0,
        "carbs_per_100g": 15.8,
        "fat_per_100g": 0.3,
        "fiber_per_100g": 1.9,
        "default_unit": "fatia",
        "grams_per_unit": 100.0,
        "synonyms": "graviola,polpa de graviola,suco de graviola,fruta graviola"
    },
    {
        "name": "Caju cru (fruto pedúnculo)",
        "category": "Frutas",
        "kcal_per_100g": 43.0,
        "protein_per_100g": 1.0,
        "carbs_per_100g": 10.3,
        "fat_per_100g": 0.3,
        "fiber_per_100g": 1.7,
        "default_unit": "unidade",
        "grams_per_unit": 100.0,
        "synonyms": "caju,fruto do caju,caju fresco,pedunculo de caju"
    },
    {
        "name": "Suco de caju natural sem açúcar",
        "category": "Bebidas",
        "kcal_per_100g": 38.0,
        "protein_per_100g": 0.5,
        "carbs_per_100g": 9.0,
        "fat_per_100g": 0.2,
        "fiber_per_100g": 0.5,
        "default_unit": "copo",
        "grams_per_unit": 200.0,
        "synonyms": "suco de caju,suco de caju natural,copo de suco de caju"
    },
    {
        "name": "Acerola crua",
        "category": "Frutas",
        "kcal_per_100g": 33.0,
        "protein_per_100g": 0.9,
        "carbs_per_100g": 8.0,
        "fat_per_100g": 0.2,
        "fiber_per_100g": 1.5,
        "default_unit": "unidade",
        "grams_per_unit": 12.0,
        "synonyms": "acerola,acerolas,suco de acerola,polpa de acerola"
    },
    {
        "name": "Carambola crua",
        "category": "Frutas",
        "kcal_per_100g": 31.0,
        "protein_per_100g": 0.9,
        "carbs_per_100g": 7.1,
        "fat_per_100g": 0.3,
        "fiber_per_100g": 2.8,
        "default_unit": "unidade",
        "grams_per_unit": 100.0,
        "synonyms": "carambola,carambolas,starfruit"
    },
    {
        "name": "Umbu cru",
        "category": "Frutas",
        "kcal_per_100g": 37.0,
        "protein_per_100g": 0.8,
        "carbs_per_100g": 9.4,
        "fat_per_100g": 0.1,
        "fiber_per_100g": 2.0,
        "default_unit": "unidade",
        "grams_per_unit": 20.0,
        "synonyms": "umbu,imbu,fruta umbu,umbuzada"
    },
    {
        "name": "Pequi cru (polpa)",
        "category": "Frutas",
        "kcal_per_100g": 205.0,
        "protein_per_100g": 2.3,
        "carbs_per_100g": 13.0,
        "fat_per_100g": 18.0,
        "fiber_per_100g": 19.0,
        "default_unit": "unidade",
        "grams_per_unit": 25.0,
        "synonyms": "pequi,polpa de pequi,caroco de pequi,pequi do cerrado"
    },
    {
        "name": "Caqui chocolate cru",
        "category": "Frutas",
        "kcal_per_100g": 71.0,
        "protein_per_100g": 0.4,
        "carbs_per_100g": 19.3,
        "fat_per_100g": 0.1,
        "fiber_per_100g": 6.5,
        "default_unit": "unidade",
        "grams_per_unit": 110.0,
        "synonyms": "caqui,caqui chocolate,caqui rama forte,persimmon"
    },
    {
        "name": "Caqui fuyu cru",
        "category": "Frutas",
        "kcal_per_100g": 65.0,
        "protein_per_100g": 0.5,
        "carbs_per_100g": 17.5,
        "fat_per_100g": 0.1,
        "fiber_per_100g": 3.6,
        "default_unit": "unidade",
        "grams_per_unit": 110.0,
        "synonyms": "caqui fuyu,caqui duro,caqui doce"
    },
    {
        "name": "Maracujá polpa fresca com semente",
        "category": "Frutas",
        "kcal_per_100g": 68.0,
        "protein_per_100g": 2.0,
        "carbs_per_100g": 12.3,
        "fat_per_100g": 2.1,
        "fiber_per_100g": 1.1,
        "default_unit": "unidade",
        "grams_per_unit": 60.0,
        "synonyms": "maracuja,maracujá,polpa de maracuja,polpa de maracujá,suco de maracuja,passion fruit"
    },
    {
        "name": "Tangerina / Mexerica Ponkan",
        "category": "Frutas",
        "kcal_per_100g": 38.0,
        "protein_per_100g": 0.8,
        "carbs_per_100g": 9.6,
        "fat_per_100g": 0.1,
        "fiber_per_100g": 0.9,
        "default_unit": "unidade",
        "grams_per_unit": 130.0,
        "synonyms": "tangerina,mexerica,ponkan,bergamota,tangerina ponkan,mexerica ponkan"
    },
    {
        "name": "Laranja lima crua",
        "category": "Frutas",
        "kcal_per_100g": 46.0,
        "protein_per_100g": 1.1,
        "carbs_per_100g": 11.5,
        "fat_per_100g": 0.1,
        "fiber_per_100g": 1.8,
        "default_unit": "unidade",
        "grams_per_unit": 130.0,
        "synonyms": "laranja lima,laranja doce,laranja para bebe,laranja suave"
    },
    {
        "name": "Jaca crua (bago)",
        "category": "Frutas",
        "kcal_per_100g": 88.0,
        "protein_per_100g": 1.4,
        "carbs_per_100g": 22.5,
        "fat_per_100g": 0.3,
        "fiber_per_100g": 2.4,
        "default_unit": "bago",
        "grams_per_unit": 20.0,
        "synonyms": "jaca,bago de jaca,jaca mole,jaca dura,jackfruit"
    },
    {
        "name": "Guaraná em pó puro",
        "category": "Diversos",
        "kcal_per_100g": 35.0,
        "protein_per_100g": 0.8,
        "carbs_per_100g": 7.0,
        "fat_per_100g": 0.4,
        "fiber_per_100g": 1.5,
        "default_unit": "colher de chá",
        "grams_per_unit": 5.0,
        "synonyms": "guarana em po,guaraná em pó,po de guarana,guarana da amazonia"
    },
    {
        "name": "Polpa de coco verde (carnuda)",
        "category": "Frutas",
        "kcal_per_100g": 105.0,
        "protein_per_100g": 1.5,
        "carbs_per_100g": 6.5,
        "fat_per_100g": 9.0,
        "fiber_per_100g": 4.0,
        "default_unit": "colher de sopa",
        "grams_per_unit": 30.0,
        "synonyms": "polpa de coco,coco verde,carne de coco,polpa do coco verde"
    },
    {
        "name": "Ameixa preta fresca",
        "category": "Frutas",
        "kcal_per_100g": 53.0,
        "protein_per_100g": 0.8,
        "carbs_per_100g": 13.9,
        "fat_per_100g": 0.2,
        "fiber_per_100g": 2.4,
        "default_unit": "unidade",
        "grams_per_unit": 45.0,
        "synonyms": "ameixa,ameixa preta,ameixa vermelha,plum"
    },
    {
        "name": "Pêssego fresco com casca",
        "category": "Frutas",
        "kcal_per_100g": 39.0,
        "protein_per_100g": 0.9,
        "carbs_per_100g": 9.5,
        "fat_per_100g": 0.3,
        "fiber_per_100g": 1.5,
        "default_unit": "unidade",
        "grams_per_unit": 100.0,
        "synonyms": "pessego,pêssego,pessego nacional,peach"
    },
    {
        "name": "Uva Niágara fresca",
        "category": "Frutas",
        "kcal_per_100g": 65.0,
        "protein_per_100g": 0.7,
        "carbs_per_100g": 16.5,
        "fat_per_100g": 0.3,
        "fiber_per_100g": 0.9,
        "default_unit": "cacho",
        "grams_per_unit": 100.0,
        "synonyms": "uva niagara,uva niágara,uva preta,uva de mesa,grapes"
    },

    # ==========================================
    # 4. LEGUMES E VERDURAS BRASILEIRAS
    # ==========================================
    {
        "name": "Ora-pro-nóbis crua",
        "category": "Verduras e Legumes",
        "kcal_per_100g": 26.0,
        "protein_per_100g": 3.8,
        "carbs_per_100g": 2.5,
        "fat_per_100g": 0.4,
        "fiber_per_100g": 3.9,
        "default_unit": "xícara",
        "grams_per_unit": 30.0,
        "synonyms": "ora-pro-nobis,ora pro nobis,ora pro nóbis,folha ora pro nobis,panc proteica"
    },
    {
        "name": "Ora-pro-nóbis refogada",
        "category": "Verduras e Legumes",
        "kcal_per_100g": 58.0,
        "protein_per_100g": 4.2,
        "carbs_per_100g": 3.5,
        "fat_per_100g": 3.2,
        "fiber_per_100g": 4.5,
        "default_unit": "colher de sopa",
        "grams_per_unit": 25.0,
        "synonyms": "ora-pro-nobis refogada,ora pro nobis refogada,ora pro nobis com alho"
    },
    {
        "name": "Taioba refogada",
        "category": "Verduras e Legumes",
        "kcal_per_100g": 48.0,
        "protein_per_100g": 2.8,
        "carbs_per_100g": 5.0,
        "fat_per_100g": 2.2,
        "fiber_per_100g": 3.2,
        "default_unit": "colher de sopa",
        "grams_per_unit": 25.0,
        "synonyms": "taioba,taioba refogada,folha de taioba,verdura mineira"
    },
    {
        "name": "Quiabo refogado",
        "category": "Verduras e Legumes",
        "kcal_per_100g": 45.0,
        "protein_per_100g": 2.1,
        "carbs_per_100g": 6.5,
        "fat_per_100g": 1.8,
        "fiber_per_100g": 4.0,
        "default_unit": "colher de sopa",
        "grams_per_unit": 25.0,
        "synonyms": "quiabo,quiabo refogado,quiabinho,quiabo com frango,okra"
    },
    {
        "name": "Quiabo cozido",
        "category": "Verduras e Legumes",
        "kcal_per_100g": 33.0,
        "protein_per_100g": 1.9,
        "carbs_per_100g": 7.0,
        "fat_per_100g": 0.2,
        "fiber_per_100g": 3.2,
        "default_unit": "unidade",
        "grams_per_unit": 15.0,
        "synonyms": "quiabo cozido,quiabo na agua"
    },
    {
        "name": "Jiló cozido / refogado",
        "category": "Verduras e Legumes",
        "kcal_per_100g": 38.0,
        "protein_per_100g": 1.4,
        "carbs_per_100g": 6.2,
        "fat_per_100g": 1.2,
        "fiber_per_100g": 4.8,
        "default_unit": "unidade",
        "grams_per_unit": 40.0,
        "synonyms": "jilo,jiló,jilo refogado,jiló refogado,jilo frito,jiló cozido"
    },
    {
        "name": "Maxixe cozido",
        "category": "Verduras e Legumes",
        "kcal_per_100g": 14.0,
        "protein_per_100g": 1.2,
        "carbs_per_100g": 2.7,
        "fat_per_100g": 0.1,
        "fiber_per_100g": 2.2,
        "default_unit": "unidade",
        "grams_per_unit": 30.0,
        "synonyms": "maxixe,maxixe cozido,maxixada,legume maxixe"
    },
    {
        "name": "Chuchu cozido",
        "category": "Verduras e Legumes",
        "kcal_per_100g": 19.0,
        "protein_per_100g": 0.8,
        "carbs_per_100g": 4.5,
        "fat_per_100g": 0.1,
        "fiber_per_100g": 1.7,
        "default_unit": "colher de sopa",
        "grams_per_unit": 30.0,
        "synonyms": "chuchu,chuchu cozido,chuchu refogado,chayote"
    },
    {
        "name": "Agrião cru",
        "category": "Verduras e Legumes",
        "kcal_per_100g": 17.0,
        "protein_per_100g": 2.2,
        "carbs_per_100g": 2.3,
        "fat_per_100g": 0.2,
        "fiber_per_100g": 2.1,
        "default_unit": "prato",
        "grams_per_unit": 50.0,
        "synonyms": "agriao,agrião,folhas de agriao,salada de agriao,watercress"
    },
    {
        "name": "Espinafre refogado",
        "category": "Verduras e Legumes",
        "kcal_per_100g": 50.0,
        "protein_per_100g": 2.7,
        "carbs_per_100g": 4.2,
        "fat_per_100g": 2.8,
        "fiber_per_100g": 2.6,
        "default_unit": "colher de sopa",
        "grams_per_unit": 25.0,
        "synonyms": "espinafre,espinafre refogado,folhas de espinafre,spinach"
    },
    {
        "name": "Couve-flor cozida ao vapor",
        "category": "Verduras e Legumes",
        "kcal_per_100g": 25.0,
        "protein_per_100g": 1.9,
        "carbs_per_100g": 4.5,
        "fat_per_100g": 0.3,
        "fiber_per_100g": 2.4,
        "default_unit": "ramalhete",
        "grams_per_unit": 40.0,
        "synonyms": "couve flor,couve-flor,couve flor cozida,cauliflower"
    },
    {
        "name": "Repolho verde cru ralado",
        "category": "Verduras e Legumes",
        "kcal_per_100g": 25.0,
        "protein_per_100g": 1.3,
        "carbs_per_100g": 5.8,
        "fat_per_100g": 0.1,
        "fiber_per_100g": 2.5,
        "default_unit": "xícara",
        "grams_per_unit": 50.0,
        "synonyms": "repolho,repolho verde,salada de repolho,cabbage"
    },
    {
        "name": "Repolho roxo cru ralado",
        "category": "Verduras e Legumes",
        "kcal_per_100g": 31.0,
        "protein_per_100g": 1.4,
        "carbs_per_100g": 7.4,
        "fat_per_100g": 0.2,
        "fiber_per_100g": 2.1,
        "default_unit": "xícara",
        "grams_per_unit": 50.0,
        "synonyms": "repolho roxo,salada de repolho roxo,red cabbage"
    },
    {
        "name": "Palmito pupunha fresco assado / grelhado",
        "category": "Verduras e Legumes",
        "kcal_per_100g": 29.0,
        "protein_per_100g": 2.5,
        "carbs_per_100g": 5.2,
        "fat_per_100g": 0.5,
        "fiber_per_100g": 2.6,
        "default_unit": "tolete",
        "grams_per_unit": 50.0,
        "synonyms": "palmito pupunha,pupunha fresca,palmito assado,palmito grelhado"
    },
    {
        "name": "Inhame cozido",
        "category": "Verduras e Legumes",
        "kcal_per_100g": 97.0,
        "protein_per_100g": 1.5,
        "carbs_per_100g": 23.2,
        "fat_per_100g": 0.2,
        "fiber_per_100g": 3.9,
        "default_unit": "pedaço",
        "grams_per_unit": 80.0,
        "synonyms": "inhame,inhame cozido,pure de inhame,yam"
    },
    {
        "name": "Cará cozido",
        "category": "Verduras e Legumes",
        "kcal_per_100g": 78.0,
        "protein_per_100g": 1.8,
        "carbs_per_100g": 18.9,
        "fat_per_100g": 0.1,
        "fiber_per_100g": 2.6,
        "default_unit": "pedaço",
        "grams_per_unit": 80.0,
        "synonyms": "cara,cará,cara cozido,cará cozido"
    },
    {
        "name": "Abóbora moranga cozida",
        "category": "Verduras e Legumes",
        "kcal_per_100g": 29.0,
        "protein_per_100g": 1.0,
        "carbs_per_100g": 6.9,
        "fat_per_100g": 0.1,
        "fiber_per_100g": 1.5,
        "default_unit": "colher de sopa",
        "grams_per_unit": 30.0,
        "synonyms": "abobora,abóbora,abobora moranga,moranga cozida,pumpkin"
    },
    {
        "name": "Vagem cozida no vapor",
        "category": "Verduras e Legumes",
        "kcal_per_100g": 35.0,
        "protein_per_100g": 1.9,
        "carbs_per_100g": 7.9,
        "fat_per_100g": 0.2,
        "fiber_per_100g": 3.2,
        "default_unit": "colher de sopa",
        "grams_per_unit": 25.0,
        "synonyms": "vagem,vagem cozida,vagem no vapor,green beans"
    },
    {
        "name": "Pimentão verde cru",
        "category": "Verduras e Legumes",
        "kcal_per_100g": 20.0,
        "protein_per_100g": 0.9,
        "carbs_per_100g": 4.6,
        "fat_per_100g": 0.2,
        "fiber_per_100g": 1.7,
        "default_unit": "unidade",
        "grams_per_unit": 80.0,
        "synonyms": "pimentao,pimentão,pimentao verde,pimentão verde,bell pepper"
    },
    {
        "name": "Berinjela refogada no azeite",
        "category": "Verduras e Legumes",
        "kcal_per_100g": 45.0,
        "protein_per_100g": 1.1,
        "carbs_per_100g": 6.0,
        "fat_per_100g": 2.2,
        "fiber_per_100g": 2.9,
        "default_unit": "colher de sopa",
        "grams_per_unit": 30.0,
        "synonyms": "berinjela,beringela,berinjela refogada,eggplant"
    },
    {
        "name": "Milho verde cozido na espiga",
        "category": "Verduras e Legumes",
        "kcal_per_100g": 108.0,
        "protein_per_100g": 3.3,
        "carbs_per_100g": 25.1,
        "fat_per_100g": 1.3,
        "fiber_per_100g": 3.9,
        "default_unit": "espiga",
        "grams_per_unit": 100.0,
        "synonyms": "espiga de milho,milho cozido,milho na espiga,milho verde cozido"
    },
    {
        "name": "Alho-poró refogado",
        "category": "Verduras e Legumes",
        "kcal_per_100g": 31.0,
        "protein_per_100g": 1.5,
        "carbs_per_100g": 7.2,
        "fat_per_100g": 0.2,
        "fiber_per_100g": 1.8,
        "default_unit": "colher de sopa",
        "grams_per_unit": 20.0,
        "synonyms": "alho poro,alho-poro,alho-poró,leek"
    },
    {
        "name": "Cheiro-verde picado (salsa e cebolinha)",
        "category": "Verduras e Legumes",
        "kcal_per_100g": 36.0,
        "protein_per_100g": 3.0,
        "carbs_per_100g": 6.3,
        "fat_per_100g": 0.8,
        "fiber_per_100g": 3.3,
        "default_unit": "colher de sopa",
        "grams_per_unit": 10.0,
        "synonyms": "cheiro verde,cheiro-verde,salsinha e cebolinha,salsa,cebolinha"
    },

    # ==========================================
    # 5. OUTROS ALIMENTOS E QUITUTES BRASILEIROS
    # ==========================================
    {
        "name": "Queijo Canastra artesanal",
        "category": "Leite e Derivados",
        "kcal_per_100g": 360.0,
        "protein_per_100g": 26.0,
        "carbs_per_100g": 1.5,
        "fat_per_100g": 28.0,
        "fiber_per_100g": 0.0,
        "default_unit": "fatia",
        "grams_per_unit": 30.0,
        "synonyms": "queijo canastra,queijo da canastra,queijo de minas canastra,canastra"
    },
    {
        "name": "Queijo do Serro artesanal",
        "category": "Leite e Derivados",
        "kcal_per_100g": 350.0,
        "protein_per_100g": 25.0,
        "carbs_per_100g": 1.8,
        "fat_per_100g": 27.0,
        "fiber_per_100g": 0.0,
        "default_unit": "fatia",
        "grams_per_unit": 30.0,
        "synonyms": "queijo do serro,queijo serro,queijo artesanal mineiro"
    },
    {
        "name": "Queijo prato fatiado",
        "category": "Leite e Derivados",
        "kcal_per_100g": 360.0,
        "protein_per_100g": 25.0,
        "carbs_per_100g": 2.0,
        "fat_per_100g": 28.0,
        "fiber_per_100g": 0.0,
        "default_unit": "fatia",
        "grams_per_unit": 30.0,
        "synonyms": "queijo prato,fatia de queijo prato,lanche queijo prato"
    },
    {
        "name": "Queijo provolone",
        "category": "Leite e Derivados",
        "kcal_per_100g": 351.0,
        "protein_per_100g": 25.6,
        "carbs_per_100g": 2.1,
        "fat_per_100g": 26.6,
        "fiber_per_100g": 0.0,
        "default_unit": "fatia",
        "grams_per_unit": 30.0,
        "synonyms": "provolone,queijo provolone,fatia de provolone"
    },
    {
        "name": "Bolo de cenoura com cobertura de chocolate",
        "category": "Doces e Sobremesas",
        "kcal_per_100g": 370.0,
        "protein_per_100g": 4.5,
        "carbs_per_100g": 54.0,
        "fat_per_100g": 15.5,
        "fiber_per_100g": 1.8,
        "default_unit": "fatia",
        "grams_per_unit": 80.0,
        "synonyms": "bolo de cenoura,bolo de cenoura com chocolate,bolo de cenoura com brigadeiro,fatia de bolo de cenoura"
    },
    {
        "name": "Bolo de fubá tradicional",
        "category": "Doces e Sobremesas",
        "kcal_per_100g": 310.0,
        "protein_per_100g": 5.0,
        "carbs_per_100g": 52.0,
        "fat_per_100g": 9.5,
        "fiber_per_100g": 2.0,
        "default_unit": "fatia",
        "grams_per_unit": 60.0,
        "synonyms": "bolo de fuba,bolo de fubá,fatia de bolo de fuba,bolo caseiro de fuba"
    },
    {
        "name": "Bolo de milho cremoso",
        "category": "Doces e Sobremesas",
        "kcal_per_100g": 311.0,
        "protein_per_100g": 4.8,
        "carbs_per_100g": 45.1,
        "fat_per_100g": 12.4,
        "fiber_per_100g": 1.0,
        "default_unit": "fatia",
        "grams_per_unit": 80.0,
        "synonyms": "bolo de milho,bolo de milho cremoso,bolo de milho verde,fatia de bolo de milho"
    },
    {
        "name": "Bolo de aipim / mandioca cremoso",
        "category": "Doces e Sobremesas",
        "kcal_per_100g": 324.0,
        "protein_per_100g": 4.4,
        "carbs_per_100g": 47.9,
        "fat_per_100g": 12.7,
        "fiber_per_100g": 1.2,
        "default_unit": "fatia",
        "grams_per_unit": 80.0,
        "synonyms": "bolo de aipim,bolo de mandioca,bolo de macaxeira,fatia de bolo de mandioca"
    },
    {
        "name": "Biscoito de polvilho assado tradicional",
        "category": "Cereais e Farinhas",
        "kcal_per_100g": 430.0,
        "protein_per_100g": 2.0,
        "carbs_per_100g": 78.0,
        "fat_per_100g": 12.5,
        "fiber_per_100g": 0.5,
        "default_unit": "porção",
        "grams_per_unit": 30.0,
        "synonyms": "biscoito de polvilho,biscoito de polvilho assado,biscoitinho de polvilho,pacote de biscoito de polvilho"
    },
    {
        "name": "Paçoca de amendoim tradicional",
        "category": "Doces e Sobremesas",
        "kcal_per_100g": 480.0,
        "protein_per_100g": 14.0,
        "carbs_per_100g": 50.0,
        "fat_per_100g": 25.0,
        "fiber_per_100g": 4.0,
        "default_unit": "unidade",
        "grams_per_unit": 20.0,
        "synonyms": "pacoca,paçoca,pacoca de amendoim,paçoca de amendoim,pacoca rolha,paçoca tipo rolha"
    },
    {
        "name": "Pé de moleque tradicional",
        "category": "Doces e Sobremesas",
        "kcal_per_100g": 460.0,
        "protein_per_100g": 12.0,
        "carbs_per_100g": 55.0,
        "fat_per_100g": 22.0,
        "fiber_per_100g": 3.5,
        "default_unit": "unidade",
        "grams_per_unit": 30.0,
        "synonyms": "pe de moleque,pé de moleque,pe de moca,pé de moça"
    },
    {
        "name": "Goiabada cascão tradicional",
        "category": "Doces e Sobremesas",
        "kcal_per_100g": 270.0,
        "protein_per_100g": 0.6,
        "carbs_per_100g": 68.0,
        "fat_per_100g": 0.2,
        "fiber_per_100g": 2.5,
        "default_unit": "fatia",
        "grams_per_unit": 40.0,
        "synonyms": "goiabada,goiabada cascao,goiabada cascão,doce de goiaba,pedaco de goiabada"
    },
    {
        "name": "Doce de leite cremoso mineiro",
        "category": "Doces e Sobremesas",
        "kcal_per_100g": 315.0,
        "protein_per_100g": 6.0,
        "carbs_per_100g": 55.0,
        "fat_per_100g": 7.5,
        "fiber_per_100g": 0.0,
        "default_unit": "colher de sopa",
        "grams_per_unit": 20.0,
        "synonyms": "doce de leite,doce de leite cremoso,doce de leite mineiro,colher de doce de leite,dulce de leche"
    },
    {
        "name": "Rapadura pura artesanal",
        "category": "Doces e Sobremesas",
        "kcal_per_100g": 350.0,
        "protein_per_100g": 0.5,
        "carbs_per_100g": 87.0,
        "fat_per_100g": 0.1,
        "fiber_per_100g": 0.5,
        "default_unit": "pedaço",
        "grams_per_unit": 25.0,
        "synonyms": "rapadura,pedaco de rapadura,rapadura de cana,rapadura pura"
    },
    {
        "name": "Caldo de cana natural / garapa",
        "category": "Bebidas",
        "kcal_per_100g": 75.0,
        "protein_per_100g": 0.2,
        "carbs_per_100g": 18.5,
        "fat_per_100g": 0.1,
        "fiber_per_100g": 0.0,
        "default_unit": "copo",
        "grams_per_unit": 200.0,
        "synonyms": "caldo de cana,garapa,copo de caldo de cana,suco de cana"
    }
]

db_path = "assets/data/taco_database.json"
with open(db_path, "r", encoding="utf-8") as f:
    existing_foods = json.load(f)

existing_names = {f["name"].strip().lower() for f in existing_foods}
start_id = max(f.get("id", 0) for f in existing_foods) + 1

added_count = 0
for food in new_foods:
    if food["name"].strip().lower() in existing_names:
        continue
    
    syn_list = [s.strip() for s in food["synonyms"].split(",") if s.strip()]
    norm_name = normalize_text(food["name"])
    syn_set = set(syn_list)
    syn_set.add(norm_name)
    for s in syn_list:
        syn_set.add(normalize_text(s))
        
    food["id"] = start_id + added_count
    food["is_custom"] = 0
    food["synonyms"] = ",".join(sorted(syn_set))
    existing_foods.append(food)
    existing_names.add(food["name"].strip().lower())
    added_count += 1

with open(db_path, "w", encoding="utf-8") as f:
    json.dump(existing_foods, f, ensure_ascii=False, indent=2)

print(f"Sucesso! {added_count} novos alimentos adicionados. Total agora: {len(existing_foods)} alimentos salvos em {db_path}!")
