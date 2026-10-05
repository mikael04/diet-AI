import json

# Lista base com dados nutricionais fiéis à tabela TACO (Unicamp) por 100g:
# kcal, proteina (g), carboidrato (g), lipidios/gordura (g), fibra (g)
# default_unit, grams_per_unit, synonyms
foods = [
    # Ovos e Aves
    {
        "name": "Ovo de galinha inteiro cozido",
        "category": "Ovos e Derivados",
        "kcal_per_100g": 146.0,
        "protein_per_100g": 13.3,
        "carbs_per_100g": 0.6,
        "fat_per_100g": 9.5,
        "fiber_per_100g": 0.0,
        "default_unit": "unidade",
        "grams_per_unit": 50.0,
        "synonyms": "ovo,ovos,ovo cozido,ovo inteiro,ovos cozidos"
    },
    {
        "name": "Ovo de galinha frito",
        "category": "Ovos e Derivados",
        "kcal_per_100g": 240.0,
        "protein_per_100g": 15.6,
        "carbs_per_100g": 1.2,
        "fat_per_100g": 18.6,
        "fiber_per_100g": 0.0,
        "default_unit": "unidade",
        "grams_per_unit": 50.0,
        "synonyms": "ovo frito,ovos fritos"
    },
    {
        "name": "Clara de ovo de galinha cozida",
        "category": "Ovos e Derivados",
        "kcal_per_100g": 59.0,
        "protein_per_100g": 13.4,
        "carbs_per_100g": 0.0,
        "fat_per_100g": 0.1,
        "fiber_per_100g": 0.0,
        "default_unit": "unidade",
        "grams_per_unit": 30.0,
        "synonyms": "clara,claras,clara de ovo,claras de ovo"
    },
    {
        "name": "Gema de ovo de galinha cozida",
        "category": "Ovos e Derivados",
        "kcal_per_100g": 353.0,
        "protein_per_100g": 15.9,
        "carbs_per_100g": 1.6,
        "fat_per_100g": 30.8,
        "fiber_per_100g": 0.0,
        "default_unit": "unidade",
        "grams_per_unit": 20.0,
        "synonyms": "gema,gemas,gema de ovo"
    },
    {
        "name": "Peito de frango grelhado sem pele",
        "category": "Carnes e Aves",
        "kcal_per_100g": 159.0,
        "protein_per_100g": 32.0,
        "carbs_per_100g": 0.0,
        "fat_per_100g": 2.5,
        "fiber_per_100g": 0.0,
        "default_unit": "g",
        "grams_per_unit": 1.0,
        "synonyms": "frango,peito de frango,frango grelhado,peito grelhado,file de frango"
    },
    {
        "name": "Peito de frango cozido sem pele",
        "category": "Carnes e Aves",
        "kcal_per_100g": 150.0,
        "protein_per_100g": 31.5,
        "carbs_per_100g": 0.0,
        "fat_per_100g": 3.0,
        "fiber_per_100g": 0.0,
        "default_unit": "g",
        "grams_per_unit": 1.0,
        "synonyms": "frango cozido,peito cozido,frango desfiado"
    },
    {
        "name": "Sobrecoxa de frango sem pele assada",
        "category": "Carnes e Aves",
        "kcal_per_100g": 233.0,
        "protein_per_100g": 28.5,
        "carbs_per_100g": 0.0,
        "fat_per_100g": 12.4,
        "fiber_per_100g": 0.0,
        "default_unit": "g",
        "grams_per_unit": 1.0,
        "synonyms": "sobrecoxa,coxa e sobrecoxa,frango assado"
    },

    # Carnes Bovinas e Suínas
    {
        "name": "Carne bovina patinho moído grelhado",
        "category": "Carnes e Aves",
        "kcal_per_100g": 219.0,
        "protein_per_100g": 35.9,
        "carbs_per_100g": 0.0,
        "fat_per_100g": 7.3,
        "fiber_per_100g": 0.0,
        "default_unit": "g",
        "grams_per_unit": 1.0,
        "synonyms": "patinho,carne moida,patinho moido,carne vermelha,carne bovina"
    },
    {
        "name": "Carne bovina alcatra grelhada sem gordura",
        "category": "Carnes e Aves",
        "kcal_per_100g": 241.0,
        "protein_per_100g": 31.9,
        "carbs_per_100g": 0.0,
        "fat_per_100g": 11.6,
        "fiber_per_100g": 0.0,
        "default_unit": "g",
        "grams_per_unit": 1.0,
        "synonyms": "alcatra,bife de alcatra,bife bovino"
    },
    {
        "name": "Carne bovina contrafilé grelhado sem gordura",
        "category": "Carnes e Aves",
        "kcal_per_100g": 278.0,
        "protein_per_100g": 35.9,
        "carbs_per_100g": 0.0,
        "fat_per_100g": 14.0,
        "fiber_per_100g": 0.0,
        "default_unit": "g",
        "grams_per_unit": 1.0,
        "synonyms": "contrafile,bife de contrafile"
    },
    {
        "name": "Carne suína lombo grelhado limpo",
        "category": "Carnes e Aves",
        "kcal_per_100g": 210.0,
        "protein_per_100g": 35.7,
        "carbs_per_100g": 0.0,
        "fat_per_100g": 6.4,
        "fiber_per_100g": 0.0,
        "default_unit": "g",
        "grams_per_unit": 1.0,
        "synonyms": "lombo,lombo suino,carne de porco magra,lombo grelhado,bife de lombo"
    },
    {
        "name": "Carne suína pernil assado sem gordura",
        "category": "Carnes e Aves",
        "kcal_per_100g": 262.0,
        "protein_per_100g": 32.1,
        "carbs_per_100g": 0.0,
        "fat_per_100g": 14.1,
        "fiber_per_100g": 0.0,
        "default_unit": "g",
        "grams_per_unit": 1.0,
        "synonyms": "pernil,pernil suino,pernil assado"
    },
    {
        "name": "Peixe tilápia filé grelhado",
        "category": "Pescados",
        "kcal_per_100g": 128.0,
        "protein_per_100g": 26.0,
        "carbs_per_100g": 0.0,
        "fat_per_100g": 2.7,
        "fiber_per_100g": 0.0,
        "default_unit": "g",
        "grams_per_unit": 1.0,
        "synonyms": "tilapia,peixe,file de peixe,peixe grelhado"
    },
    {
        "name": "Atum sólido em conserva em água",
        "category": "Pescados",
        "kcal_per_100g": 120.0,
        "protein_per_100g": 26.2,
        "carbs_per_100g": 0.0,
        "fat_per_100g": 0.9,
        "fiber_per_100g": 0.0,
        "default_unit": "lata",
        "grams_per_unit": 120.0,
        "synonyms": "atum,atum em agua,atum natural,lata de atum"
    },
    {
        "name": "Salmão filé grelhado",
        "category": "Pescados",
        "kcal_per_100g": 229.0,
        "protein_per_100g": 24.0,
        "carbs_per_100g": 0.0,
        "fat_per_100g": 14.0,
        "fiber_per_100g": 0.0,
        "default_unit": "g",
        "grams_per_unit": 1.0,
        "synonyms": "salmao,file de salmao"
    },

    # Cereais, Grãos e Leguminosas
    {
        "name": "Arroz branco cozido",
        "category": "Cereais e Leguminosas",
        "kcal_per_100g": 128.0,
        "protein_per_100g": 2.5,
        "carbs_per_100g": 28.1,
        "fat_per_100g": 0.2,
        "fiber_per_100g": 1.6,
        "default_unit": "colher de sopa",
        "grams_per_unit": 25.0,
        "synonyms": "arroz,arroz branco,arroz cozido"
    },
    {
        "name": "Arroz integral cozido",
        "category": "Cereais e Leguminosas",
        "kcal_per_100g": 124.0,
        "protein_per_100g": 2.6,
        "carbs_per_100g": 25.8,
        "fat_per_100g": 1.0,
        "fiber_per_100g": 2.7,
        "default_unit": "colher de sopa",
        "grams_per_unit": 25.0,
        "synonyms": "arroz integral,arroz preto,arroz cateto"
    },
    {
        "name": "Feijão carioca cozido (50% grão 50% caldo)",
        "category": "Cereais e Leguminosas",
        "kcal_per_100g": 76.0,
        "protein_per_100g": 4.8,
        "carbs_per_100g": 13.6,
        "fat_per_100g": 0.5,
        "fiber_per_100g": 8.5,
        "default_unit": "concha",
        "grams_per_unit": 130.0,
        "synonyms": "feijao,feijao carioca,concha de feijao"
    },
    {
        "name": "Feijão preto cozido (50% grão 50% caldo)",
        "category": "Cereais e Leguminosas",
        "kcal_per_100g": 77.0,
        "protein_per_100g": 4.5,
        "carbs_per_100g": 14.0,
        "fat_per_100g": 0.5,
        "fiber_per_100g": 8.4,
        "default_unit": "concha",
        "grams_per_unit": 130.0,
        "synonyms": "feijao preto,concha de feijao preto"
    },
    {
        "name": "Lentilha cozida",
        "category": "Cereais e Leguminosas",
        "kcal_per_100g": 93.0,
        "protein_per_100g": 6.3,
        "carbs_per_100g": 16.3,
        "fat_per_100g": 0.5,
        "fiber_per_100g": 7.9,
        "default_unit": "concha",
        "grams_per_unit": 130.0,
        "synonyms": "lentilha,lentilhas"
    },
    {
        "name": "Grão-de-bico cozido",
        "category": "Cereais e Leguminosas",
        "kcal_per_100g": 164.0,
        "protein_per_100g": 8.9,
        "carbs_per_100g": 27.4,
        "fat_per_100g": 2.6,
        "fiber_per_100g": 7.6,
        "default_unit": "colher de sopa",
        "grams_per_unit": 30.0,
        "synonyms": "grao de bico,grao-de-bico"
    },

    # Pães, Farinhas e Cereais
    {
        "name": "Pão francês tradicional",
        "category": "Pães e Farinhas",
        "kcal_per_100g": 300.0,
        "protein_per_100g": 8.0,
        "carbs_per_100g": 58.6,
        "fat_per_100g": 3.1,
        "fiber_per_100g": 2.3,
        "default_unit": "unidade",
        "grams_per_unit": 50.0,
        "synonyms": "pao,pao frances,pao de sal,cacetinho"
    },
    {
        "name": "Pão de forma integral",
        "category": "Pães e Farinhas",
        "kcal_per_100g": 253.0,
        "protein_per_100g": 9.4,
        "carbs_per_100g": 49.9,
        "fat_per_100g": 3.7,
        "fiber_per_100g": 6.9,
        "default_unit": "fatia",
        "grams_per_unit": 25.0,
        "synonyms": "pao de forma,pao integral,fatia de pao integral"
    },
    {
        "name": "Aveia em flocos",
        "category": "Pães e Farinhas",
        "kcal_per_100g": 394.0,
        "protein_per_100g": 13.9,
        "carbs_per_100g": 66.6,
        "fat_per_100g": 8.5,
        "fiber_per_100g": 9.1,
        "default_unit": "colher de sopa",
        "grams_per_unit": 15.0,
        "synonyms": "aveia,flocos de aveia,aveia em flocos finos"
    },
    {
        "name": "Farinha de aveia",
        "category": "Pães e Farinhas",
        "kcal_per_100g": 394.0,
        "protein_per_100g": 14.5,
        "carbs_per_100g": 67.0,
        "fat_per_100g": 8.0,
        "fiber_per_100g": 10.0,
        "default_unit": "colher de sopa",
        "grams_per_unit": 15.0,
        "synonyms": "farinha de aveia"
    },
    {
        "name": "Farelo de aveia",
        "category": "Pães e Farinhas",
        "kcal_per_100g": 353.0,
        "protein_per_100g": 17.3,
        "carbs_per_100g": 50.8,
        "fat_per_100g": 7.0,
        "fiber_per_100g": 15.4,
        "default_unit": "colher de sopa",
        "grams_per_unit": 10.0,
        "synonyms": "farelo de aveia"
    },
    {
        "name": "Goma de mandioca (Tapioca)",
        "category": "Pães e Farinhas",
        "kcal_per_100g": 242.0,
        "protein_per_100g": 0.5,
        "carbs_per_100g": 60.0,
        "fat_per_100g": 0.0,
        "fiber_per_100g": 0.9,
        "default_unit": "colher de sopa",
        "grams_per_unit": 20.0,
        "synonyms": "tapioca,goma de tapioca,massa de tapioca"
    },
    {
        "name": "Farofa tradicional temperada",
        "category": "Pães e Farinhas",
        "kcal_per_100g": 412.0,
        "protein_per_100g": 2.1,
        "carbs_per_100g": 80.3,
        "fat_per_100g": 9.1,
        "fiber_per_100g": 6.8,
        "default_unit": "colher de sopa",
        "grams_per_unit": 15.0,
        "synonyms": "farofa,farofa pronta,farofa de mandioca"
    },
    {
        "name": "Cuscuz de milho cozido",
        "category": "Pães e Farinhas",
        "kcal_per_100g": 113.0,
        "protein_per_100g": 2.2,
        "carbs_per_100g": 25.1,
        "fat_per_100g": 0.7,
        "fiber_per_100g": 1.8,
        "default_unit": "fatia",
        "grams_per_unit": 100.0,
        "synonyms": "cuscuz,cuscuz nordestino,cuscuz de milho"
    },
    {
        "name": "Macarrão de trigo cozido",
        "category": "Pães e Farinhas",
        "kcal_per_100g": 141.0,
        "protein_per_100g": 4.5,
        "carbs_per_100g": 29.0,
        "fat_per_100g": 0.8,
        "fiber_per_100g": 1.5,
        "default_unit": "prato",
        "grams_per_unit": 200.0,
        "synonyms": "macarrao,espaguete,massa,macarronada"
    },

    # Laticínios e Derivados
    {
        "name": "Leite de vaca integral",
        "category": "Laticínios",
        "kcal_per_100g": 60.0,
        "protein_per_100g": 3.1,
        "carbs_per_100g": 4.7,
        "fat_per_100g": 3.2,
        "fiber_per_100g": 0.0,
        "default_unit": "copo",
        "grams_per_unit": 200.0,
        "synonyms": "leite,leite integral,copo de leite"
    },
    {
        "name": "Leite de vaca desnatado",
        "category": "Laticínios",
        "kcal_per_100g": 35.0,
        "protein_per_100g": 3.4,
        "carbs_per_100g": 5.0,
        "fat_per_100g": 0.1,
        "fiber_per_100g": 0.0,
        "default_unit": "copo",
        "grams_per_unit": 200.0,
        "synonyms": "leite desnatado"
    },
    {
        "name": "Queijo muçarela",
        "category": "Laticínios",
        "kcal_per_100g": 281.0,
        "protein_per_100g": 22.6,
        "carbs_per_100g": 3.0,
        "fat_per_100g": 20.0,
        "fiber_per_100g": 0.0,
        "default_unit": "fatia",
        "grams_per_unit": 25.0,
        "synonyms": "mucarela,queijo mucarela,mussarela,queijo mussarela,queijo"
    },
    {
        "name": "Queijo Minas frescal",
        "category": "Laticínios",
        "kcal_per_100g": 227.0,
        "protein_per_100g": 17.4,
        "carbs_per_100g": 3.2,
        "fat_per_100g": 16.0,
        "fiber_per_100g": 0.0,
        "default_unit": "fatia",
        "grams_per_unit": 30.0,
        "synonyms": "queijo minas,queijo branco,queijo frescal"
    },
    {
        "name": "Queijo cottage",
        "category": "Laticínios",
        "kcal_per_100g": 98.0,
        "protein_per_100g": 11.1,
        "carbs_per_100g": 3.4,
        "fat_per_100g": 4.3,
        "fiber_per_100g": 0.0,
        "default_unit": "colher de sopa",
        "grams_per_unit": 30.0,
        "synonyms": "cottage,queijo cottage"
    },
    {
        "name": "Requeijão cremoso tradicional",
        "category": "Laticínios",
        "kcal_per_100g": 257.0,
        "protein_per_100g": 9.6,
        "carbs_per_100g": 2.4,
        "fat_per_100g": 23.4,
        "fiber_per_100g": 0.0,
        "default_unit": "colher de sopa",
        "grams_per_unit": 30.0,
        "synonyms": "requeijao,requeijao cremoso"
    },
    {
        "name": "Requeijão cremoso light",
        "category": "Laticínios",
        "kcal_per_100g": 172.0,
        "protein_per_100g": 12.0,
        "carbs_per_100g": 4.0,
        "fat_per_100g": 12.0,
        "fiber_per_100g": 0.0,
        "default_unit": "colher de sopa",
        "grams_per_unit": 30.0,
        "synonyms": "requeijao light"
    },
    {
        "name": "Iogurte natural integral",
        "category": "Laticínios",
        "kcal_per_100g": 61.0,
        "protein_per_100g": 3.5,
        "carbs_per_100g": 4.7,
        "fat_per_100g": 3.3,
        "fiber_per_100g": 0.0,
        "default_unit": "pote",
        "grams_per_unit": 170.0,
        "synonyms": "iogurte,iogurte natural"
    },

    # Frutas
    {
        "name": "Banana prata crua",
        "category": "Frutas",
        "kcal_per_100g": 98.0,
        "protein_per_100g": 1.3,
        "carbs_per_100g": 26.0,
        "fat_per_100g": 0.1,
        "fiber_per_100g": 2.0,
        "default_unit": "unidade",
        "grams_per_unit": 80.0,
        "synonyms": "banana,banana prata,unidade de banana"
    },
    {
        "name": "Banana nanica crua",
        "category": "Frutas",
        "kcal_per_100g": 92.0,
        "protein_per_100g": 1.4,
        "carbs_per_100g": 23.8,
        "fat_per_100g": 0.1,
        "fiber_per_100g": 1.9,
        "default_unit": "unidade",
        "grams_per_unit": 90.0,
        "synonyms": "banana nanica"
    },
    {
        "name": "Maçã fuji com casca",
        "category": "Frutas",
        "kcal_per_100g": 56.0,
        "protein_per_100g": 0.3,
        "carbs_per_100g": 15.2,
        "fat_per_100g": 0.2,
        "fiber_per_100g": 2.1,
        "default_unit": "unidade",
        "grams_per_unit": 130.0,
        "synonyms": "maca,maca fuji,maca com casca,unidade de maca"
    },
    {
        "name": "Mamão papaya cru",
        "category": "Frutas",
        "kcal_per_100g": 40.0,
        "protein_per_100g": 0.5,
        "carbs_per_100g": 10.4,
        "fat_per_100g": 0.1,
        "fiber_per_100g": 1.0,
        "default_unit": "metade",
        "grams_per_unit": 140.0,
        "synonyms": "mamao,mamao papaya,papaya"
    },
    {
        "name": "Laranja pêra crua",
        "category": "Frutas",
        "kcal_per_100g": 37.0,
        "protein_per_100g": 1.0,
        "carbs_per_100g": 8.9,
        "fat_per_100g": 0.1,
        "fiber_per_100g": 0.8,
        "default_unit": "unidade",
        "grams_per_unit": 130.0,
        "synonyms": "laranja,laranja pera"
    },
    {
        "name": "Abacate cru",
        "category": "Frutas",
        "kcal_per_100g": 96.0,
        "protein_per_100g": 1.2,
        "carbs_per_100g": 6.0,
        "fat_per_100g": 8.4,
        "fiber_per_100g": 6.3,
        "default_unit": "colher de sopa",
        "grams_per_unit": 35.0,
        "synonyms": "abacate,avocado"
    },
    {
        "name": "Morango cru",
        "category": "Frutas",
        "kcal_per_100g": 30.0,
        "protein_per_100g": 0.9,
        "carbs_per_100g": 6.8,
        "fat_per_100g": 0.3,
        "fiber_per_100g": 1.7,
        "default_unit": "unidade",
        "grams_per_unit": 15.0,
        "synonyms": "morango,morangos"
    },
    {
        "name": "Melancia crua",
        "category": "Frutas",
        "kcal_per_100g": 33.0,
        "protein_per_100g": 0.9,
        "carbs_per_100g": 8.1,
        "fat_per_100g": 0.0,
        "fiber_per_100g": 0.1,
        "default_unit": "fatia",
        "grams_per_unit": 200.0,
        "synonyms": "melancia,fatia de melancia"
    },

    # Vegetais, Legumes e Tubérculos
    {
        "name": "Batata inglesa cozida",
        "category": "Tubérculos e Legumes",
        "kcal_per_100g": 52.0,
        "protein_per_100g": 1.2,
        "carbs_per_100g": 11.9,
        "fat_per_100g": 0.1,
        "fiber_per_100g": 1.3,
        "default_unit": "unidade",
        "grams_per_unit": 140.0,
        "synonyms": "batata,batata inglesa,batata cozida"
    },
    {
        "name": "Batata doce cozida",
        "category": "Tubérculos e Legumes",
        "kcal_per_100g": 77.0,
        "protein_per_100g": 0.6,
        "carbs_per_100g": 18.4,
        "fat_per_100g": 0.1,
        "fiber_per_100g": 2.2,
        "default_unit": "unidade",
        "grams_per_unit": 140.0,
        "synonyms": "batata doce,batata-doce,batata doce cozida"
    },
    {
        "name": "Mandioca cozida (Aipim/Macaxeira)",
        "category": "Tubérculos e Legumes",
        "kcal_per_100g": 125.0,
        "protein_per_100g": 0.6,
        "carbs_per_100g": 30.1,
        "fat_per_100g": 0.3,
        "fiber_per_100g": 1.6,
        "default_unit": "pedaço",
        "grams_per_unit": 100.0,
        "synonyms": "mandioca,aipim,macaxeira,mandioca cozida"
    },
    {
        "name": "Brócolis cozido",
        "category": "Tubérculos e Legumes",
        "kcal_per_100g": 25.0,
        "protein_per_100g": 2.1,
        "carbs_per_100g": 4.4,
        "fat_per_100g": 0.5,
        "fiber_per_100g": 3.4,
        "default_unit": "ramo",
        "grams_per_unit": 40.0,
        "synonyms": "brocolis,brocolis cozido"
    },
    {
        "name": "Cenoura crua",
        "category": "Tubérculos e Legumes",
        "kcal_per_100g": 34.0,
        "protein_per_100g": 1.3,
        "carbs_per_100g": 7.7,
        "fat_per_100g": 0.2,
        "fiber_per_100g": 3.2,
        "default_unit": "unidade",
        "grams_per_unit": 100.0,
        "synonyms": "cenoura,cenoura crua,cenoura ralada"
    },
    {
        "name": "Tomate cru com semente",
        "category": "Tubérculos e Legumes",
        "kcal_per_100g": 15.0,
        "protein_per_100g": 1.1,
        "carbs_per_100g": 3.1,
        "fat_per_100g": 0.2,
        "fiber_per_100g": 1.2,
        "default_unit": "unidade",
        "grams_per_unit": 100.0,
        "synonyms": "tomate,tomate cru,rodelas de tomate"
    },
    {
        "name": "Alface crespa crua",
        "category": "Tubérculos e Legumes",
        "kcal_per_100g": 11.0,
        "protein_per_100g": 1.3,
        "carbs_per_100g": 1.7,
        "fat_per_100g": 0.2,
        "fiber_per_100g": 1.8,
        "default_unit": "folha",
        "grams_per_unit": 10.0,
        "synonyms": "alface,folha de alface,salada"
    },
    {
        "name": "Milho verde em conserva",
        "category": "Tubérculos e Legumes",
        "kcal_per_100g": 98.0,
        "protein_per_100g": 3.2,
        "carbs_per_100g": 17.1,
        "fat_per_100g": 2.4,
        "fiber_per_100g": 4.6,
        "default_unit": "colher de sopa",
        "grams_per_unit": 20.0,
        "synonyms": "milho,milho verde,milho em conserva"
    },
    {
        "name": "Ervilha em conserva drenada",
        "category": "Tubérculos e Legumes",
        "kcal_per_100g": 74.0,
        "protein_per_100g": 4.6,
        "carbs_per_100g": 13.4,
        "fat_per_100g": 0.4,
        "fiber_per_100g": 5.1,
        "default_unit": "colher de sopa",
        "grams_per_unit": 20.0,
        "synonyms": "ervilha,ervilhas,ervilha em conserva"
    },

    # Oleaginosas e Gorduras
    {
        "name": "Azeite de oliva extravirgem",
        "category": "Óleos e Gorduras",
        "kcal_per_100g": 884.0,
        "protein_per_100g": 0.0,
        "carbs_per_100g": 0.0,
        "fat_per_100g": 100.0,
        "fiber_per_100g": 0.0,
        "default_unit": "colher de sopa",
        "grams_per_unit": 13.0,
        "synonyms": "azeite,azeite de oliva,colher de azeite"
    },
    {
        "name": "Amendoim torrado sem sal",
        "category": "Oleaginosas",
        "kcal_per_100g": 589.0,
        "protein_per_100g": 27.2,
        "carbs_per_100g": 18.7,
        "fat_per_100g": 49.7,
        "fiber_per_100g": 8.0,
        "default_unit": "colher de sopa",
        "grams_per_unit": 15.0,
        "synonyms": "amendoim,amendoim torrado"
    },
    {
        "name": "Pasta de amendoim integral",
        "category": "Oleaginosas",
        "kcal_per_100g": 588.0,
        "protein_per_100g": 28.0,
        "carbs_per_100g": 15.0,
        "fat_per_100g": 50.0,
        "fiber_per_100g": 7.5,
        "default_unit": "colher de sopa",
        "grams_per_unit": 20.0,
        "synonyms": "pasta de amendoim,manteiga de amendoim"
    },
    {
        "name": "Castanha-de-caju torrada",
        "category": "Oleaginosas",
        "kcal_per_100g": 570.0,
        "protein_per_100g": 18.5,
        "carbs_per_100g": 29.1,
        "fat_per_100g": 46.3,
        "fiber_per_100g": 3.7,
        "default_unit": "unidade",
        "grams_per_unit": 3.0,
        "synonyms": "castanha,castanha de caju,castanha-de-caju"
    },

    # Suplementação e Especiais
    {
        "name": "Whey Protein Concentrado 80%",
        "category": "Suplementos",
        "kcal_per_100g": 400.0,
        "protein_per_100g": 80.0,
        "carbs_per_100g": 6.7,
        "fat_per_100g": 6.0,
        "fiber_per_100g": 0.0,
        "default_unit": "scoop",
        "grams_per_unit": 30.0,
        "synonyms": "whey,whey protein,whey concentrado,scoop de whey,proteina"
    },
    {
        "name": "Whey Protein Isolado 90%",
        "category": "Suplementos",
        "kcal_per_100g": 370.0,
        "protein_per_100g": 90.0,
        "carbs_per_100g": 1.5,
        "fat_per_100g": 1.0,
        "fiber_per_100g": 0.0,
        "default_unit": "scoop",
        "grams_per_unit": 30.0,
        "synonyms": "whey isolado,wpi,whey protein isolado"
    },
    {
        "name": "Creatina monohidratada",
        "category": "Suplementos",
        "kcal_per_100g": 0.0,
        "protein_per_100g": 0.0,
        "carbs_per_100g": 0.0,
        "fat_per_100g": 0.0,
        "fiber_per_100g": 0.0,
        "default_unit": "scoop",
        "grams_per_unit": 5.0,
        "synonyms": "creatina,scoop de creatina"
    },
    {
        "name": "Cacau em pó 100%",
        "category": "Diversos",
        "kcal_per_100g": 228.0,
        "protein_per_100g": 19.6,
        "carbs_per_100g": 57.9,
        "fat_per_100g": 13.7,
        "fiber_per_100g": 33.2,
        "default_unit": "colher de sopa",
        "grams_per_unit": 10.0,
        "synonyms": "cacau,cacau em po,cacau 100%"
    },
    {
        "name": "Café passado sem açúcar",
        "category": "Bebidas",
        "kcal_per_100g": 2.0,
        "protein_per_100g": 0.1,
        "carbs_per_100g": 0.3,
        "fat_per_100g": 0.0,
        "fiber_per_100g": 0.0,
        "default_unit": "xícara",
        "grams_per_unit": 100.0,
        "synonyms": "cafe,cafe preto,xicara de cafe"
    }
]

# Adicionando identificadores únicos
for idx, food in enumerate(foods, start=1):
    food["id"] = idx
    food["is_custom"] = 0

output_path = "assets/data/taco_database.json"
with open(output_path, "w", encoding="utf-8") as f:
    json.dump(foods, f, ensure_ascii=False, indent=2)

print(f"Sucesso: {len(foods)} alimentos salvos em {output_path}")
