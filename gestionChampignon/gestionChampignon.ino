// version Arduino
String versionArduino = "tag 1.41";

#include <ArduinoJson.h> 

#define pinAir 6 // Déshumidifie
#define pinEau 31 // humidifie

#define pinOuvert 27 // Ouvert vanne
#define pinFerme 25 // Ferme vanne


// Pin Relai pour ventilo Capteur
#define pinVentilo 7

// Protoype function
void ioData();
void cronTimer();
void regulateurAir(float);
void regulateurHumidite();
void gestionDeltaAirPositif(unsigned long);
void gestionDeltaAirNegatif(unsigned long);
void gestionHumidite();
double calculHumidite();
float getTemperature(int);
int calculMoySondeAna(int, int);
float calculPression(float);
void activeVentilo();
void desactiveVentilo();
void periodeBrume();
void activeDeshum();
void desactiveDeshum();
void receiveData();
void actionMot(String);
String lireVoieSerie();
void delayAS(unsigned long);

//JSON
const int capacity = JSON_OBJECT_SIZE(200); // capacité du JSON
StaticJsonDocument<capacity> document;

// etalonage
float etalonageSec = 1;
float etalonageHum = 1;
float etalonageAir = 0.43;

// Consigne
float consigneHum = 86;
float modifConsigneHum = 0.12;

float consigneAir = 17;  //  20.90   18 5
float modifConsigneAir = 0.12;

int tabVal[31];

float temperatureAir = 0;
float temperatureAirP = 0;   
 
float deltaTemp = 0;
float coeffH = 0;
float coeffD = 0;

//moyenne
float moyHum = 0;
float moySec = 0;

int etatVanneFroid = 10;

double tauxHumidite = 0;

unsigned long intervalle = millis();// tout les 12H
unsigned long intervalleJour = millis();
unsigned long intervalleActivation = millis();

float debutTabTemp = 10;
float finTabTemp = 35;

unsigned long tempsFermetureBrume = 0;

int nbJour = 10;

unsigned long dureeAction = 0; 
unsigned long dureeActivationBrume = 60000;
unsigned long timerDeshum = 0;


// Timer entre les mesures et actions

//float pasTabTemp = 0.1;

float tabPressionSaturante [251] = {
  12.28,12.364,12.448,12.532,12.616,12.7,12.784,12.868,12.952,13.036,13.12,13.21,13.3,13.39,13.48,13.57,13.66,13.75,13.84,13.93,14.02,14.115,14.21,14.305,14.4,14.495,14.59,14.685,14.78,14.875,14.97,15.071,15.172,15.273,15.374,15.475,15.576,15.677,15.778,15.879,
  15.98,16.087,16.194,16.301,16.408,16.515,16.622,16.729,16.836,16.943,17.05,17.163,17.276,17.389,17.502,17.615,17.728,17.841,17.954,18.067,18.18,18.299,18.418,18.537,18.656,18.775,18.894,19.013,19.132,19.251,19.37,19.496,19.622,19.748,19.874,20,20.126,20.252,20.378,20.504,20.63,20.764,20.898,
  21.032,21.166,21.3,21.434,21.568,21.702,21.836,21.97,22.111,22.252,22.393,22.534,22.675,22.816,22.957,23.098,23.239,23.38,23.529,23.678,23.827,23.976,24.125,24.274,24.423,24.572,24.721,24.87,25.026,25.182,25.338,25.494,25.65,25.806,25.962,26.118,26.274,26.43,26.596,26.762,26.928,27.094,
  27.26,27.426,27.592,27.758,27.924,28.09,28.264,28.438,28.612,28.786,28.96,29.134,29.308,29.482,29.656,29.83,30.014,30.198,30.382,30.566,30.75,30.934,31.118,31.302,31.486,31.67,31.863,32.056,32.249,32.442,32.635,32.828,33.021,33.214,33.407,33.6,33.804,34.008,34.212,34.416,34.62,34.824,35.028,
  35.232,35.436,35.64,35.856,36.072,36.288,36.504,36.72,36.936,37.152,37.368,37.584,37.8,38.025,38.25,38.475,38.7,38.925,39.15,39.375,39.6,39.825,40.05,40.288,40.526,40.764,41.002,41.24,41.478,41.716,41.954,42.192,42.43,42.679,42.928,43.177,43.426,43.675,43.924,44.173,44.422,44.671,44.92,
  45.183,45.446,45.709,45.972,46.235,46.498,46.761,47.024,47.287,47.55,47.825,48.1,48.375,48.65,48.925,49.2,49.475,49.75,50.025,50.3,50.589,50.878,51.167,51.456,51.745,52.034,52.323,52.612,52.901,53.19,53.494,53.798,54.102,54.406,54.71,55.014,55.318,55.622,55.926,56.23
};

// CONSTANTE DUREE
unsigned long tempsOuvertureBrume = 15000; // 15 secondes
unsigned long timerHum            = 90000; // 1 minute 30
unsigned long timerMesure         = 180000; // 3 minutes
unsigned long cinq                = 300000; // 5 mintes
unsigned long dix                 = 600000; // 10 minutes
unsigned long douze               = 43200000; // 12 heures
unsigned long jour                = 86400000; // 24 heures

String suiviProcess = "Allumage";
String suiviSousProcess = "";

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
} //Fin de setup 

// // LOOP : programme principal (qui tourne en boucle)
void loop(){
  ioData();

  cronTimer();

  suiviProcess = "Gestion Temperature";
  suiviSousProcess = "";
  gestionTemperature();

  if(nbJour > 5){
    suiviProcess = "Gestion Humidite";
    suiviSousProcess = "";
    // init moySec et moyHum
    gestionHumidite();

    tauxHumidite =  calculHumidite(); 
      
    regulateurHumidite();
  }else{
    if(millis() - intervalleActivation > dureeActivationBrume){
      suiviProcess = "Periode Brume";
      suiviSousProcess = "";
      periodeBrume();
      intervalleActivation = millis();
    }
  }

  // Timer entre les mesures
  suiviProcess = "Attente entre Boucle";
  delayAS(cinq);
}  //fin de loop.

void delayAS(unsigned long dureeTimer){
  unsigned long timerMesure = millis();

  while(millis() - timerMesure <= dureeTimer){
    delay(200);
    ioData();
  }
}

void gestionTemperature(){
    // reglage du Temperature Air
    temperatureAir = 0;
    temperatureAir = getTemperature(A0);
    suiviSousProcess = "Mesure Temperature Air";delayAS(100);
    if(temperatureAir > 10 && temperatureAir < 30){
      temperatureAir = temperatureAir + etalonageAir;

      deltaTemp = temperatureAir - consigneAir;
      dureeAction = 0;

      regulateurAir(deltaTemp);  
    }
}

StaticJsonDocument<capacity> generateJSON()
{
  document["temperatureAir"]=temperatureAir;
  document["consigneAir"]=consigneAir;
  document["modifConsigneAir"]=modifConsigneAir;
  
  document["tauxHumidite"]=tauxHumidite;
  document["consigneHum"]=consigneHum;  
  document["modifConsigneHum"]=modifConsigneHum;
  
  document["dureeAction"]=dureeAction;
  document["coeff"]=deltaTemp;
  document["etatVanneFroid"]=etatVanneFroid;
  
  document["moySec"]=moySec;
  document["moyHum"]=moyHum;
  
  document["tempsDeshum"]=timerDeshum;
  document["tempsOuvertureBrume"]=tempsOuvertureBrume;
  document["tempsFermetureBrume"]=tempsFermetureBrume;
  document["dureeActivationBrume"]=dureeActivationBrume;

  document["etalonageAir"] = etalonageAir;
  document["etalonageHum"] = etalonageHum;
  document["etalonageSec"] = etalonageSec;
  
  document["nbJour"]=nbJour;
  document["Millis"]=millis();
  document["versionArduino"] = versionArduino;
  
  document["suiviProcess"] = suiviProcess;
  document["suiviSousProcess"] = suiviSousProcess;

  return document;
}

void envoieData(StaticJsonDocument<capacity> document){
  serializeJson(document, Serial);
  Serial.println();
  delay(100);
}
void ioData(){
  document = generateJSON();
  receiveData();
  delay(200);
  envoieData(document);
}

void cronTimer(){
  if(millis() - intervalle >  douze) {
    consigneAir -= modifConsigneAir;
    consigneHum -= modifConsigneHum;

    intervalle = millis();
  }

  if(millis() - intervalleJour > jour){
    nbJour++;
    intervalleJour = millis();
  }
}


void regulateurAir(float deltaTemp){
  unsigned long duree = 0;

  if(deltaTemp > 0){   
    if (deltaTemp > 0.3 && deltaTemp < 0.5){
      duree = 2000;
    } // ouverture 2 sec    
    if (deltaTemp > 0.5 && deltaTemp < 1){
      duree = 5000;
    } // ouverture 5 sec 
    if (deltaTemp > 1 && deltaTemp < 1.5){
      duree = 15000;
    } // ouverture 15 sec
    if (deltaTemp > 1.5){
      duree = 40000;
    } // ouverture totale
    suiviSousProcess = "Temperature Trop haut";
    gestionDeltaAirPositif(duree);
  }

  if(deltaTemp < 0){
    if (deltaTemp < -0.3 && deltaTemp > -0.5){
      duree = 2000; 
    } // fermeture 2 sec
    if (deltaTemp < -0.5 && deltaTemp > -1){
      duree = 5000; 
    } // fermeture 5 sec
    if (deltaTemp < -1 && deltaTemp > -1.5){ 
      duree = 15000;
    } // fermeture 15 sec
    if (deltaTemp < -1.5){
      duree = 40000;
    } // fermeture totale
    suiviSousProcess = "Temperature Trop bas";
    gestionDeltaAirNegatif(duree);
  }
   
  if(etatVanneFroid < 0){
    etatVanneFroid = 0;
  }else if(etatVanneFroid > 30){
    etatVanneFroid = 30;
  }
}

void regulateurHumidite(){
 // Action
  if(tauxHumidite < consigneHum){
    suiviSousProcess = "Humidite Trop bas";
    coeffH = consigneHum - tauxHumidite;
    if (coeffH>0.3){
      if (coeffH > 0.3 && coeffH < 1) {tempsFermetureBrume = 105000;} // ouverture 2 sec    
      if (coeffH > 1 && coeffH < 2)   {tempsFermetureBrume = 60000;} // ouverture 5 sec 
      if (coeffH > 2 && coeffH < 3)   {tempsFermetureBrume = 45000;} // ouverture 15 sec
      if (coeffH > 3)                 {tempsFermetureBrume = 30000;}

      periodeBrume();
    }
  }
  else if(tauxHumidite > consigneHum){
    suiviSousProcess = "Humidite Trop haut";
    coeffD=tauxHumidite-consigneHum;

    if (coeffD > 0.3  && coeffD < 1)  {timerDeshum=180000;} // ouverture 2 sec    
    if (coeffD > 1    && coeffD < 2)  {timerDeshum=300000;} // ouverture 5 sec 
    if (coeffD > 2    && coeffD < 3)  {timerDeshum=360000;} // ouverture 15 sec
    if (coeffD > 3)                   {timerDeshum=480000;}

    activeDeshum();
    delayAS(timerDeshum);
    desactiveDeshum();
  }
}

void gestionDeltaAirPositif(unsigned long duree){
  digitalWrite (pinFerme,LOW);
  digitalWrite (pinOuvert,LOW);
  delayAS(duree);  
  digitalWrite (pinFerme,HIGH); 
  digitalWrite (pinOuvert,HIGH); 
 
  etatVanneFroid += duree / 1000;

  dureeAction = duree;
}

void gestionDeltaAirNegatif(unsigned long duree){
  digitalWrite (pinFerme,LOW);
  delayAS (duree); 
  digitalWrite (pinFerme,HIGH);
  etatVanneFroid -= duree / 1000;

  dureeAction = duree;
}

void gestionHumidite(){
// calcul moyenne du lot Sec
  float temperatureSecP = 0;
  float lotTempSec = 0;

  // calcul moyenne sec
  float totalTempSec = 0;
  int compteurSec = 0;

  // calcul moyenne du lot Hum  
  float temperatureHumP = 0;
  float lotTempHum = 0;

  // calcul moyenne hum
  float totalTempHum = 0;
  int compteurHum = 0;

  unsigned long debutMesure = millis();

  bool continuerMesure = true;

  float moyenneSec = 0;
  float moyenneHum = 0;

  activeVentilo();

  while(continuerMesure){
    // ---------------------------------------------------------------- //
    // Partie temperature sec  
    // calcul lot de temperature sec
    suiviSousProcess = "Mesure Temperature Sec";
    temperatureSecP = getTemperature(A2);
    if(temperatureSecP > 10 && temperatureSecP < 30){
      // total temperature sec
      totalTempSec += temperatureSecP;
      compteurSec++; // nombre de valeur de tempSec ajouter
    }

    // ---------------------------------------------------------------- //
    // Partie temperature humide
    if(millis() - debutMesure > timerHum){ // commence au bout de 1m30 
    // calcul lot de temperature hum
      temperatureHumP = getTemperature(A1);  // acquisition de la température hum
      suiviSousProcess = "Mesure Temperature Humide";
      if(temperatureHumP > 10 && temperatureHumP < 30){
        // total temperature hum
        totalTempHum +=  temperatureHumP;
        compteurHum++;
      }
    }

    if(millis() - debutMesure > timerMesure){
      continuerMesure = false;
    }
  }
    
  desactiveVentilo();

  moyenneSec = totalTempSec / compteurSec; // Valeur moyenne
  moyenneSec += etalonageSec;
  
  moyenneHum = totalTempHum / compteurHum; // Valeur moyenne
  moyenneHum += etalonageHum;

  moySec = moyenneSec;
  moyHum = moyenneHum;
}

 
double calculHumidite(){
  tauxHumidite = 0;
      
  float pressionSaturanteHum = 0;
  float pressionSaturanteSec = 0;

  pressionSaturanteHum = calculPression(moyHum);
  pressionSaturanteSec = calculPression(moySec);

  double PW = 0;

  PW = pressionSaturanteHum - 1013 * 0.000662 * (moySec - moyHum);

  return PW/pressionSaturanteSec * 100;
}

float getTemperature(int pin){
  float temperatureP = 0;
  float temperature = 0;
  float moyenne = 0;

  for(int i=0; i<31; i++){
    temperatureP = analogRead(pin); 
    if (temperatureP < 205 || temperatureP > 1023){
      tabVal[i] = 0;
    }else{
      tabVal[i] = temperatureP;
    }

    // recupére la veleur
    delayAS(250);
  }

  moyenne = calculMoySondeAna(tabVal, sizeof(tabVal) / sizeof(tabVal[0]));

  temperature = (float)map(moyenne, 205, 1023, 100, 400) / 10;

  return temperature;
}

// TODO Recup taille d'un tableau
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

  while(etatRelayVentilo == HIGH){
    digitalWrite(pinVentilo, LOW);
    delayAS(5000);
    etatRelayVentilo = digitalRead(pinVentilo);
  }
}

void desactiveVentilo(){
  int etatRelayVentilo = digitalRead(pinVentilo);

  while(etatRelayVentilo == LOW){
    digitalWrite(pinVentilo , HIGH);
    delayAS(5000);
    etatRelayVentilo = digitalRead(pinVentilo);
  }    
}

void periodeBrume(){
  suiviSousProcess = "Brume En Cours";
  unsigned long debutbrume = millis();
  bool continuerMesurebrume = true;
  
  while(continuerMesurebrume){
    digitalWrite(pinEau, LOW); // allume
    delayAS(tempsOuvertureBrume); // 15sec
    digitalWrite(pinEau, HIGH); // eteint
    delayAS(tempsFermetureBrume); // 3min

    if(millis() - debutbrume > dix){
      continuerMesurebrume = false;
    }
  }
}

void activeDeshum(){
  int etatRelayDeshum = digitalRead(pinAir);

  while(etatRelayDeshum == HIGH){
    digitalWrite(pinAir , LOW);
    delayAS(5000);
    etatRelayDeshum = digitalRead(pinAir);
  }    
}

void desactiveDeshum(){
  int etatRelayDeshum = digitalRead(pinAir);

  while(etatRelayDeshum == LOW){
    digitalWrite(pinAir , HIGH);
    delayAS(5000);
    etatRelayDeshum = digitalRead(pinAir);
  }    
}

void receiveData(void){
    actionMot(lireVoieSerie());
}

void actionMot(String mot){
  String data = "";

  if(mot.indexOf("J") >= 0){
    while(Serial.available() == 0){
      true;
    }

    data = lireVoieSerie();

    char dataJour[200];
    data.toCharArray(dataJour, 200);

    StaticJsonDocument<capacity> docJour;
    deserializeJson(docJour, dataJour);

    nbJour = docJour["nBJ"].as<int>();

    actionMot(lireVoieSerie());
  }

  if(mot.indexOf("dA") >= 0){
    while(Serial.available() == 0){
      true;
    }

    data = lireVoieSerie();
    char dataDureeActivation[200];
    data.toCharArray(dataDureeActivation, 200);

    StaticJsonDocument<capacity> docDureeActivation;
    deserializeJson(docDureeActivation, dataDureeActivation);

    dureeActivationBrume = docDureeActivation["dA"].as<long>();

    actionMot(lireVoieSerie());
  }

  if(mot.indexOf("mA")>= 0){
      while(Serial.available() == 0){
        true;
      }
      data = lireVoieSerie();
      char dataModifAir[200];
      data.toCharArray(dataModifAir, 200);
      StaticJsonDocument<capacity> docModifAir;
      deserializeJson(docModifAir, dataModifAir);

      consigneAir = docModifAir["cA"].as<float>();

      actionMot(lireVoieSerie());
  }

  
  if(mot.indexOf("mH")>= 0){
      while(Serial.available() == 0){
        true;
      }
      data = lireVoieSerie();
      char dataModifHum[200];
      data.toCharArray(dataModifHum, 200);
      StaticJsonDocument<capacity> docModifHum;
      deserializeJson(docModifHum, dataModifHum);

      consigneHum = docModifHum["cH"].as<float>();

      actionMot(lireVoieSerie());
  }
    
    if(mot.indexOf("mFA")>= 0){
      while(Serial.available() == 0){
        true;
      }
      data = lireVoieSerie();
      char datamodifFacteurAir[200];
      data.toCharArray(datamodifFacteurAir, 200);
      StaticJsonDocument<capacity> docModifFacteurAir;
      deserializeJson(docModifFacteurAir, datamodifFacteurAir);

      modifConsigneAir = docModifFacteurAir["cFA"].as<float>();

      actionMot(lireVoieSerie());
    }  
  
    if(mot.indexOf("mFH")>= 0){
      while(Serial.available() == 0){
        true;
      }
      data = lireVoieSerie();
      char datamodifFacteurHum[200];
      data.toCharArray(datamodifFacteurHum, 200);
      StaticJsonDocument<capacity> docModifFacteurHum;
      deserializeJson(docModifFacteurHum, datamodifFacteurHum);

      modifConsigneHum = docModifFacteurHum["cFH"].as<float>();

      actionMot(lireVoieSerie());
    }

    if(mot.indexOf("eAir") >= 0){
     while(Serial.available() == 0){
        true;
      }
      data = lireVoieSerie();
      char dataEtalonageAir[200];
      data.toCharArray(dataEtalonageAir, 200);
      StaticJsonDocument<capacity> docEtalonageAir;
      deserializeJson(docEtalonageAir, dataEtalonageAir);

      etalonageAir = docEtalonageAir["eAir"].as<float>();

      actionMot(lireVoieSerie());
    }

    if(mot.indexOf("eSec") >= 0){
     while(Serial.available() == 0){
        true;
      }
      data = lireVoieSerie();
      char dataEtalonageSec[200];
      data.toCharArray(dataEtalonageSec, 200);
      StaticJsonDocument<capacity> docEtalonageSec;
      deserializeJson(docEtalonageSec, dataEtalonageSec);

      etalonageSec = docEtalonageSec["eSec"].as<float>();

      actionMot(lireVoieSerie());
    }

    if(mot.indexOf("eHum") >= 0){
     while(Serial.available() == 0){
        true;
      }
      data = lireVoieSerie();
      char dataEtalonageHum[200];
      data.toCharArray(dataEtalonageHum, 200);
      StaticJsonDocument<capacity> docEtalonageHum;
      deserializeJson(docEtalonageHum, dataEtalonageHum);

      etalonageHum = docEtalonageHum["eHum"].as<float>();

      actionMot(lireVoieSerie());
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

    return data;
}
