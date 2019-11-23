#include <ArduinoJson.h> 
#include <Adafruit_MAX31865.h> 

#define pinAir 6 // Déshumidifie
#define pinEau 31 // humidifie

#define pinOuvert 27 // Ouvert vanne
#define pinFerme 25 // Ferme vanne


// Pin Relai pour ventilo Capteur
#define pinVentilo 7
#define desactiveVentilo() activeVentilo()
#define desactiveDeshum() activeDeshum()

//JSON
const int capacity = JSON_OBJECT_SIZE(20); // capacité du JSON
StaticJsonDocument<capacity> document;

// etalonage
float etalonageSec = 1.20;
float etalonageHum = 0.43;
float etalonageAir = 0.43;

// Consigne
float consigneHum = 95;
float modifConsigneHum = 0.12;

float consigneAir = 20.52;  //  20.90   18 5
float modifConsigneAir = 0.12;
int tabVal[31];

float temperatureAir = 0;
float temperatureAirP = 0;   
 
float coeff = 0;
float coeffH = 0;
float coeffD = 0;

//moyenne
float moyHum = 0;
float moySec = 0;

int etatVanneFroid = 10;

double tauxHumidite = 0;

unsigned long intervalle = millis();// tout les 12H
unsigned long intervalleJour = millis();

long dix = 600000;
long douze= 43200000;
long jour = 86400000;
int nbJour = 1;

int dureeAction = 0; 

// Temps de la mesure des températures
long timerMesure = 180000;//180000

// Temps de la mesure des températures humide
long timerHum = 90000;// 90000
long timerDeshum = 0;
long ferme=0;

// Timer entre les mesures et actions
long timerRepete = 600000;
float debutTabTemp = 10;
float finTabTemp = 35;
//float pasTabTemp = 0.1;

float tabPressionSaturante [251] = {
  12.28,12.364,12.448,12.532,12.616,12.7,12.784,12.868,12.952,13.036,13.12,13.21,13.3,13.39,13.48,13.57,13.66,13.75,13.84,13.93,14.02,14.115,14.21,14.305,14.4,14.495,14.59,14.685,14.78,14.875,14.97,15.071,15.172,15.273,15.374,15.475,15.576,15.677,15.778,15.879,
  15.98,16.087,16.194,16.301,16.408,16.515,16.622,16.729,16.836,16.943,17.05,17.163,17.276,17.389,17.502,17.615,17.728,17.841,17.954,18.067,18.18,18.299,18.418,18.537,18.656,18.775,18.894,19.013,19.132,19.251,19.37,19.496,19.622,19.748,19.874,20,20.126,20.252,20.378,20.504,20.63,20.764,20.898,
  21.032,21.166,21.3,21.434,21.568,21.702,21.836,21.97,22.111,22.252,22.393,22.534,22.675,22.816,22.957,23.098,23.239,23.38,23.529,23.678,23.827,23.976,24.125,24.274,24.423,24.572,24.721,24.87,25.026,25.182,25.338,25.494,25.65,25.806,25.962,26.118,26.274,26.43,26.596,26.762,26.928,27.094,
  27.26,27.426,27.592,27.758,27.924,28.09,28.264,28.438,28.612,28.786,28.96,29.134,29.308,29.482,29.656,29.83,30.014,30.198,30.382,30.566,30.75,30.934,31.118,31.302,31.486,31.67,31.863,32.056,32.249,32.442,32.635,32.828,33.021,33.214,33.407,33.6,33.804,34.008,34.212,34.416,34.62,34.824,35.028,
  35.232,35.436,35.64,35.856,36.072,36.288,36.504,36.72,36.936,37.152,37.368,37.584,37.8,38.025,38.25,38.475,38.7,38.925,39.15,39.375,39.6,39.825,40.05,40.288,40.526,40.764,41.002,41.24,41.478,41.716,41.954,42.192,42.43,42.679,42.928,43.177,43.426,43.675,43.924,44.173,44.422,44.671,44.92,
  45.183,45.446,45.709,45.972,46.235,46.498,46.761,47.024,47.287,47.55,47.825,48.1,48.375,48.65,48.925,49.2,49.475,49.75,50.025,50.3,50.589,50.878,51.167,51.456,51.745,52.034,52.323,52.612,52.901,53.19,53.494,53.798,54.102,54.406,54.71,55.014,55.318,55.622,55.926,56.23
};

 

// // SETUP //_____________________________________________________________________________________________ 
 
void setup() { 
 
  
  // initialisation de l'affichage et du mode console      
  Serial.begin(9600);             // préparation du moniteur série 

  // Setup Relay
  pinMode(pinAir, OUTPUT);
  digitalWrite(pinAir, HIGH);
  pinMode(pinEau, OUTPUT);
  digitalWrite(pinEau, HIGH);
  pinMode(pinVentilo, OUTPUT);
  digitalWrite(pinVentilo, HIGH);
  pinMode(pinEau, OUTPUT);
  digitalWrite(pinEau, HIGH);
  pinMode (pinOuvert,OUTPUT); 
  digitalWrite(pinOuvert, HIGH);
  pinMode (pinFerme,OUTPUT);
  digitalWrite(pinFerme, HIGH);
}                                 //Fin de setup 
  
// // LOOP : programme principal (qui tourne en boucle)
//____________________________________________________________________________________________ 
 
void loop(){
     document=generateJSON(document);
     receiveData();
     envoieData(document);

  // Calcule la moyenne des releves de temperature du capteur Sec
  // Récupère la valeur mini de temperature du capteur Hum
  // Jusqu'a que la temperature Hum augmente
   
  //++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++   
  if(millis()-intervalle >  douze) {
    consigneAir=consigneAir - modifConsigneAir;
    consigneHum = consigneHum - modifConsigneHum;

    intervalle=millis();
  }

  if(millis() - intervalleJour > jour){
    nbJour++;
    intervalleJour += jour;
  }

  Serial.print("consigne  Air        "); Serial.println(consigneAir);

  // reglage du froid


  temperatureAir = getTemperature(A0);

  if(temperatureAir > 10 && temperatureAir < 30){
    temperatureAir = temperatureAir+etalonageAir;
    Serial.print("Temperature Air        "); Serial.println(temperatureAir);
    
    coeff = temperatureAir-consigneAir;
    
    dureeAction = 0;  
    
    if (coeff > 0.3 && coeff < 0.5){
      dureeAction = 2000; 
      digitalWrite (pinFerme,LOW);
      digitalWrite (pinOuvert,LOW);
      delay(dureeAction);  
      digitalWrite (pinFerme,HIGH); 
      digitalWrite (pinOuvert,HIGH); 
      Serial.print("vanne ouver 2 sec  ");  
      etatVanneFroid += 2;
    } // ouverture 2 sec    
    if (coeff > 0.5 && coeff < 1){
      dureeAction = 5000;  
      digitalWrite (pinFerme,LOW);
      digitalWrite (pinOuvert,LOW);
      delay (dureeAction);  
      digitalWrite (pinFerme,HIGH);
      digitalWrite (pinOuvert,HIGH);  
      Serial.print("vanne ouver 5 sec  ");
      etatVanneFroid += 5;
    } // ouverture 5 sec 
    if (coeff > 1 && coeff < 1.5){
      dureeAction = 15000; 
      digitalWrite (pinFerme,LOW);
      digitalWrite (pinOuvert,LOW);
      delay (dureeAction);  
      digitalWrite (pinFerme,HIGH);
      digitalWrite (pinOuvert,HIGH);   
      Serial.print("vanne ouver 15sec  ");
      etatVanneFroid += 15;
    } // ouverture 15 sec
    if (coeff > 1.5){
      dureeAction = 40000; 
      digitalWrite (pinFerme,LOW);
      digitalWrite (pinOuvert,LOW);
      delay (dureeAction); 
      digitalWrite (pinFerme,HIGH); 
      digitalWrite (pinOuvert,HIGH);  
      Serial.print("vanne ouver totale  ");
      etatVanneFroid += 40;
    } // ouverture totale 

    if (coeff < -0.3 && coeff > -0.5){
      dureeAction = 2000; 
      digitalWrite (pinFerme,LOW);
      delay (dureeAction);  
      digitalWrite (pinFerme,HIGH);  
      Serial.print("vanne ferme 2 sec  ");
      etatVanneFroid -= 2;
    } // fermeture 2 sec
    if (coeff < -0.5 && coeff > -1){
      dureeAction = 5000; 
      digitalWrite (pinFerme,LOW);
      delay (dureeAction);  
      digitalWrite (pinFerme,HIGH);  
      Serial.print("vanne ferme 5 sec  ");
      etatVanneFroid -= 5;
    } // fermeture 5 sec
    if (coeff < -1 && coeff > -1.5){ 
      dureeAction = 15000;
      digitalWrite (pinFerme,LOW);
      delay (dureeAction);  
      digitalWrite (pinFerme,HIGH);  
      Serial.print("vanne ferme 15 sec  ");
      etatVanneFroid -= 15;
    } // fermeture 15 sec
    if (coeff < -1.5){
      dureeAction = 40000;
      digitalWrite (pinFerme,LOW);
      delay (dureeAction); 
      digitalWrite (pinFerme,HIGH);  
      Serial.print("vanne ferme 40 sec  ");
      etatVanneFroid -= 40;
    } // fermeture totale

    if(etatVanneFroid < 0){
      etatVanneFroid = 0;
    }else if(etatVanneFroid > 30){
      etatVanneFroid = 30;
    }
  }

  activeVentilo();
  
  // calcul moyenne du lot Sec
  float temperatureSecP = 0;
  float lotTempSec = 0;
  float moyLotSec = 0;

  // calcul moyenne sec
  float totalTempSec = 0;
  float compteurSec = 0;

  moySec = 0;

  // calcul moyenne du lot Hum  
  float temperatureHumP = 0;
  float lotTempHum = 0;
  float moyLotHum = 0;

  // calcul moyenne hum
  float totalTempHum = 0;
  float compteurHum = 0;

  moyHum = 0;

  unsigned long debutMesure = millis();

  bool continuerMesure = true;

  while(continuerMesure){
    // ---------------------------------------------------------------- //
    // Partie temperature sec
    int nbMesure = 0;

    // calcul lot de temperature sec
    while(nbMesure < 20){
      temperatureSecP = getTemperature(A1);

      if(temperatureSecP > 10 && temperatureSecP < 30){
        lotTempSec += temperatureSecP;
        nbMesure++;
      }
    }

  // total temperature sec
  totalTempSec += lotTempSec / nbMesure;
  compteurSec++; // nombre de valeur de tempSec ajouter

  lotTempSec = 0;

    // ---------------------------------------------------------------- //
    // Partie temperature humide
    if(millis() - debutMesure > timerHum){ // commence au bout de 1m30
      nbMesure = 0;

      // calcul lot de temperature hum
      while(nbMesure < 20){
        temperatureHumP = getTemperature(A2);  // acquisition de la température hum

        if(temperatureHumP > 10 && temperatureHumP < 30){
          lotTempHum += temperatureHumP;
          nbMesure++;
        }
      }
      
      // total temperature hum
      totalTempHum += lotTempHum / nbMesure;
      compteurHum++;

      lotTempHum=0;
    }
    
    delay(1000);

    if(millis() - debutMesure > timerMesure){
      continuerMesure = false;
    }
  }

  desactiveVentilo();

  Serial.println("Fin des Releve");
   
  moySec = totalTempSec / compteurSec; // Valeur moyenne
  moySec += etalonageSec;
  
  moyHum = totalTempHum / compteurHum; // Valeur moyenne
  moyHum += etalonageHum;
    
  Serial.print("Temperature Seche"); Serial.println(moySec);
  Serial.print("Temperature Humide"); Serial.println(moyHum);

  tauxHumidite = 0;
      
  float pressionSaturanteHum = 0;
  float pressionSaturanteSec = 0;

  pressionSaturanteHum = calculPression(moyHum);
  pressionSaturanteSec = calculPression(moySec);

  double PW = 0;

  PW = pressionSaturanteHum - 1013 * 0.000662 * (moySec - moyHum);

  tauxHumidite = PW/pressionSaturanteSec * 100;

  //Serial.print("pressionSaturanteSec"); Serial.println(pressionSaturanteSec);
  //Serial.print("pressionSaturantehum"); Serial.println(pressionSaturanteHum);
  Serial.print("tauxHumidite"); Serial.println(tauxHumidite);  
    
  // Action
  if(tauxHumidite < consigneHum){
    coeffH=consigneHum-tauxHumidite;
    if (coeffH<0.3){
      delay(780000);
    }
      if (coeffH > 0.3 && coeffH < 1   )  {ferme=105000;   } // ouverture 2 sec    
      if (coeffH > 1 && coeffH < 2  )  {  ferme=60000;    } // ouverture 5 sec 
      if (coeffH> 2   && coeffH < 3 )  { ferme=45000;     } // ouverture 15 sec
      if (coeffH> 3              )  {  ferme=30000;    }

      periodeBrume(ferme);

      Serial.print("------------------arrosage----------");
      Serial.print("temps");Serial.print(ferme);
  }
  else if(tauxHumidite > consigneHum){
     coeffD=tauxHumidite-consigneHum;

    if (coeffD<0.3){
      delay(780000);
    }

    if (coeffD > 0.3 && coeffD < 1   )  {timerDeshum=180000;   } // ouverture 2 sec    
    if (coeffD > 1 && coeffD < 2  )  {  timerDeshum=300000;    } // ouverture 5 sec 
    if (coeffD > 2   && coeffD < 3 )  { timerDeshum=360000;     } // ouverture 15 sec
    if (coeffD > 3              )  {  timerDeshum=480000;    }
    activeDeshum();
    Serial.print("------------------desu----------");
    Serial.print("temps");Serial.print(timerDeshum);
    delay(timerDeshum);
    desactiveDeshum();  
  }
    
  generateJSON(document);
  envoieData(document);
  // Timer entre les mesures
  delay(timerRepete);
}  //fin de loop.


float getTemperature(int pin){
  int temperatureP = 0;
  int temperature = 0;
  int moyenne = 0;

  for(int i=0; i<31; i++){
      temperatureP = analogRead(pin); 
      if (temperatureP < 205 || temperatureP > 1023){
        tabVal[i] = 0;
      }else{
        tabVal[i] = temperatureP;
      }

      // recupére la veleur
      delay(250);
    }


    moyenne = calculMoySondeAna(tabVal, sizeof(tabVal) / sizeof(tabVal[0]));

    temperature = (float)map(moyenne, 205, 1023, 100, 400) / 10;

    return temperature;
}

int calculMoySondeAna(int tab[], int tailleTab){
  int total = 0;
  for(int i = 0; i < tailleTab - 1; i++){
    if(tab[i] > tab[i + 1]){
      int tmp = tab[i];
      tab[i] = tab[i + 1];
      tab[i + 1] = tmp;

      i = -1;
    }
  }

  int valeurInutile = 10;
  for(int i = 5; i < tailleTab - 5; i++){
    if(tab[i] != 0){
      total += tab[i];
    }else{
      valeurInutile++;
    }
  }

  return total / (tailleTab - valeurInutile);
}

float calculPression(float temp){
  float pression = 0;
  int iterateur = 0;
  float tempIterateur = debutTabTemp;

  // Recupere la pression saturante
  while(tempIterateur <= finTabTemp && pression == 0){
    if(temp > tempIterateur - 0.05 && temp <= tempIterateur + 0.05){
      pression = tabPressionSaturante[iterateur];
    }
    else{
      iterateur++;
      tempIterateur += 0.1;
    }
  }

  return pression;
}

void activeVentilo(){
  int etatRelayVentilo = digitalRead(pinVentilo);

  if(etatRelayVentilo == LOW){
    digitalWrite(pinVentilo, HIGH);
  }
  else{
    digitalWrite(pinVentilo, LOW);
  }
}

void periodeBrume(int ferme){
  int ouvert = 15000;
  unsigned long debutbrume = millis();
  bool continuerMesurebrume = true;
  
  while(continuerMesurebrume){
    digitalWrite(pinEau, LOW); // allume
    delay(ouvert); // 15sec
    digitalWrite(pinEau, HIGH); // eteint
    delay(ferme); // 3min

    if(millis() - debutbrume > dix){
      continuerMesurebrume = false;
    }
  }
}

void activeDeshum(){
  int etatRelayVent = digitalRead(pinAir);

  if(etatRelayVent == LOW){
    digitalWrite(pinAir, HIGH);
  }
  else{
    digitalWrite(pinAir, LOW);
  }
}

void receiveData(void){
    actionMot(lireVoieSerie());
}

void actionMot(String mot){
  String data = "";

  if(mot.equals("modifAir")){
    while(Serial.available() == 0){
      true;
    }

    data = lireVoieSerie();
    consigneAir = data.toFloat();

    mot = lireVoieSerie();
  }

  if(mot.equals("modifHum")){
    while(Serial.available() == 0){
      true;
    }

    data = lireVoieSerie();
    consigneHum = data.toFloat();

    mot = lireVoieSerie();
  }

  if(mot.equals("modifFacteurAir")){
    while(Serial.available() == 0){
      true;
    }
    
    data = lireVoieSerie();
    modifConsigneAir = data.toFloat();

    mot = lireVoieSerie();
  }

  
  if(mot.equals("modifFacteurHum")){
    while(Serial.available() == 0){
      true;
    }
    
    data = lireVoieSerie();
    modifConsigneHum = data.toFloat();

    mot = lireVoieSerie();
  }
  
}

String lireVoieSerie(void)
{
    // variable locale pour l'incrémentation des données du tableau
    int i = 0;
    String data = "";

    // on lit les caractères tant qu'il y en a
    // OU si jamais le nombre de caractères lus atteint 19
    // (limite du tableau stockant le mot - 1 caractère)
    while(Serial.available() > 0)
    {
        // on enregistre le caractère lu
        char lettre = Serial.read();
        if((int)lettre != 10){
          data += lettre;
        }else{
          return data;
        }
        // laisse un peu de temps entre chaque accès a la mémoire
        delay(10);
        // on passe à l'indice suivant
        i++;
    }
    // on supprime le caractère '\n'
    // et on le remplace par celui de fin de chaine '\0'
    Serial.print(data);

    return data;
}

StaticJsonDocument<capacity> generateJSON()
{
  document = new StaticJsonDocument<capacity>();
  document["temperatureAir"]=temperatureAir;
  document["consigneAir"]=consigneAir;
  document["tauxHumidite"]=tauxHumidite;
  document["consigneHum"]=consigneHum;  
  document["modifConsigneAir"]=modifConsigneAir;
  document["modifConsigneHum"]=modifConsigneHum;
  document["dureeAction"]=dureeAction;
  document["coeff"]=coeff;
  document["etatVanneFroid"]=etatVanneFroid;
  document["moySec"]=moySec;
  document["moyHum"]=moyHum;
  document["nbJour"]=nbJour;
  document["Millis"]=millis();
  return document;
}

void envoieData(StaticJsonDocument<capacity> document){
  serializeJson(document,Serial);
  Serial.println();
}
