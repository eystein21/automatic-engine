class Kort {
    constructor(verdi, farge, tall) {
        this.verdi = verdi;
        this.farge = farge;
        this.tall = tall;
    }
}

class Kortstokk {
    constructor(farger = ['clubs', 'diamonds', 'hearts', 'spades'], verdier = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king', 'ace']) {
        this.farger = farger;
        this.verdier = verdier;
    }
//setter sammen hver av fargene med verdier
    stokkortene() {
        let stokkort = [];
        for (let farge of this.farger) {
            for (let verdi of this.verdier) {
                let tall = verdi;
                if (verdi === 'jack' || verdi === 'queen' || verdi === 'king') {
                    tall = 10;
                } else if (verdi === 'ace') {
                    tall = 11;
                } else {
                    tall = parseInt(verdi);
                }
                stokkort.push(new Kort(verdi, farge, tall));
            }
        }
//stokker kortene 
        for (let i = stokkort.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            [stokkort[i], stokkort[j]] = [stokkort[j], stokkort[i]];
        }

        return stokkort;
    }
}

class Spiller {
    constructor(navn, saldo = 10000) {
        this.navn = navn;
        this.hånd = [];
        this.poeng = 0;
        this.saldo = saldo;
        this.esssomerbrukt = 0;
    }
//definerer hva poeng er og sjekker om det er ett ess i hånden, hvis det er det så øker esssomerbrukt 
//sånn at man ikke kan -10 evig
    mottaKort(kort) {
        this.hånd.push(kort);
        this.poeng += kort.tall;
        if (this.poeng > 21) {
            let essTeller = this.hånd.filter(kort => kort.verdi === 'ace').length;
            if (essTeller > this.esssomerbrukt) {
                this.poeng -= 10;
                this.esssomerbrukt += 1;
            }
        }
    }

    bet(beløp) {
        if (beløp > this.saldo) {
            throw new Error("Du har ikke nok penger!");
        }
        this.saldo -= beløp;
        return beløp;
    }

    mottapenger(beløp) {
        this.saldo += beløp;
    }
}
//setter reglene for dealeren
class Dealer extends Spiller {
    constructor() {
        super("Dealer");
    }
    spillLogikk() {
        return this.poeng < 17;
    }
}

class Spill {
    constructor(spillerNavn) {
        this.kortstokk = new Kortstokk();
        this.kort = this.kortstokk.stokkortene();
        this.spiller = new Spiller(spillerNavn);
        this.dealer = new Dealer();
        this.spillerTrekker = true;
        this.innsats = 0;

        document.getElementById("restartBtn").addEventListener("click", () => this.restart());
        this.hitHandler = this.hit.bind(this);
    }

    start() {
        let beløp = parseInt(prompt('Hvor mange penger vil du satse? Du har ' + this.spiller.saldo));
        try {
            this.innsats = this.spiller.bet(beløp);
        } catch (error) {
            alert(error.message);
            return;
        }
//tar det øverste korte i korstokken og gir det ut
        for (let i = 0; i < 2; i++) {
            this.spiller.mottaKort(this.kort.pop());
            this.dealer.mottaKort(this.kort.pop());
        }

        this.oppdaterCanvas();
        document.getElementById("standBtn").addEventListener("click", () => this.stand());

        const canvas = document.getElementById("gameCanvas");
        canvas.removeEventListener("click", this.hitHandler); // Forhindrer flere klikk
        canvas.addEventListener("click", this.hitHandler);
    }

    restart() {
        this.kort = this.kortstokk.stokkortene();
        this.spiller.hånd = [];
        this.spiller.poeng = 0;
        this.dealer.hånd = [];
        this.dealer.poeng = 0;
        this.spillerTrekker = true;
        this.innsats = 0;
        this.spiller.esssomerbrukt = 0;

        this.start();
    }

    hit() {
        if (this.spillerTrekker) {
            this.spiller.mottaKort(this.kort.pop());
            this.oppdaterCanvas();

            if (this.spiller.poeng > 21) {
                alert("Bust! Du tapte.");
                this.spillerTrekker = false; // Stopper at den "hit" flere ganger
            }
        }
    }

    stand() {
        this.spillerTrekker = false;
        while (this.dealer.spillLogikk()) {
            this.dealer.mottaKort(this.kort.pop());
        }
        this.oppdaterCanvas();
        this.vinner();
    }

    vinner() {
        if (this.spiller.poeng > this.dealer.poeng && this.spiller.poeng <= 21) {
            alert(this.spiller.navn + ' vinner!');
            this.spiller.mottapenger(this.innsats * 2);
        } else if (this.spiller.poeng > 21) {
            alert(this.spiller.navn + ' bust!');
        } else if (this.dealer.poeng > 21) {
            alert('Dealer bust! Du vinner!');
            this.spiller.mottapenger(this.innsats * 2);
        } else if (this.spiller.poeng < this.dealer.poeng) {
            alert('Dealer vinner!');
        } else {
            alert('Push! Ingen vinner.');
            this.spiller.mottapenger(this.innsats);
        }
        this.oppdaterCanvas();
    }

    oppdaterCanvas() {
        const canvas = document.getElementById("gameCanvas");
        const ctx = canvas.getContext("2d");

        ctx.fillStyle = "#2e7d32"; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        this.tegnKortstokk(ctx, 650, 60);

        ctx.fillStyle = "white";
        ctx.font = "20px Arial";
        ctx.fillText('Hit', 690, 230);

        ctx.fillText(this.spiller.navn + "'s hånd:", 50, 50);
        this.spiller.hånd.forEach((kort, index) => {
            this.tegnKort(ctx, kort, 50 + index * 80, 60);
        });

        ctx.fillText('Poeng: ' + this.spiller.poeng, 50, 180);
        ctx.fillText('Spiller Saldo: ' + this.spiller.saldo, 50, 500);

        ctx.fillText('Dealerens hånd:', 50, 240);
        if (this.spillerTrekker) {
            this.tegnKort(ctx, this.dealer.hånd[0], 50, 260);
            this.tegnSkjultKort(ctx, 130, 260);
        } else {
            this.dealer.hånd.forEach((kort, index) => {
                this.tegnKort(ctx, kort, 50 + index * 80, 260);
            });
        }

        const dealerPoeng = this.spillerTrekker ? "??" : this.dealer.poeng;
        ctx.fillText('Dealerens poeng: ' + dealerPoeng, 50, 380);
    }

    tegnKortstokk(ctx, x, y) {
        const bilde = new Image();
        bilde.src = 'bilder/images.png';

        bilde.onload = () => {
            ctx.drawImage(bilde, x, y, 105, 150);
        };
    }

    tegnKort(ctx, kort, x, y) {
        const bilde = new Image();
        bilde.src = 'bilder/' + kort.verdi + '_of_' + kort.farge + '.png';

        bilde.onload = () => {
            ctx.drawImage(bilde, x, y, 70, 100);
        };
    }

    tegnSkjultKort(ctx, x, y) {
        const skjultKort = new Image();
        skjultKort.src = 'bilder/images.png';

        skjultKort.onload = () => {
            ctx.drawImage(skjultKort, x, y, 70, 100);
        };
    }
}

let nyttSpill = new Spill("spiller");
nyttSpill.start();
