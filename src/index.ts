import express, {type NextFunction, type Request, type Response,} from "express";

import axios from "axios";

import cors from "cors";

type LD = {

    id: number;
    filmName: string;
    rotationType:"CAV"|"CLV";
    region: string;
    lenghtMinutes: number;
    videoFormat:"NTSC"|"PAL";

}

let Discos: LD[] = [

    {id: 1, filmName: "Car movie yes", rotationType:"CLV",region: "HollyWood", lenghtMinutes: 120 ,videoFormat:"NTSC"},

    {id: 2, filmName: "Action movie yes", rotationType:"CAV",region: "BollyWood", lenghtMinutes: 120,videoFormat:"PAL"},

];

const app = express();
app.use(cors());
app.use(express.json());

const validarDisco = (datos: any, parcial = false): string | null => {
    if (!datos) return "Se esperan parámetros de entrada";

    const { filmName, rotationType, region, lenghtMinutes, videoFormat } = datos;

    if (!parcial) {
        if (!filmName || !rotationType || !region || lenghtMinutes === undefined || !videoFormat) {
            return "Faltan campos obligatorios";
        }
    }

    if (filmName !== undefined && typeof filmName !== "string") return "filmName debe ser string";
    if (region !== undefined && typeof region !== "string") return "region debe ser string";
    if (rotationType !== undefined && typeof rotationType !== "string") return "rotationType debe ser string";
    if (lenghtMinutes !== undefined && typeof lenghtMinutes !== "number") return "lenghtMinutes debe ser número";
    if (videoFormat !== undefined && typeof videoFormat !== "string") return "videoFormat debe ser string";

    if (rotationType !== undefined && rotationType !== "CAV" && rotationType !== "CLV")
        return "rotationType inválido. Debe ser 'CAV' o 'CLV'.";
    if (videoFormat !== undefined && videoFormat !== "NTSC" && videoFormat !== "PAL")
        return "videoFormat inválido. Debe ser 'NTSC' o 'PAL'.";

    return null;
};



const extraerDisco = (datos: any): LD =>
{

    const tamanhoBaseDeDatos = Discos.length;
    const ultimoId = Discos[tamanhoBaseDeDatos - 1]?.id ?? 0;
    const nuevoId: number = ultimoId === 0 ? ultimoId : ultimoId + 1;
    const Nombre: string = datos.filmName;
    const Rotation: "CAV"|"CLV"= datos.rotationType;
    const Region : string = datos.region;
    const Minutes : number = datos.lenghtMinutes;
    const Format : "NTSC"| "PAL" = datos.videoFormat;


    return {
        id: nuevoId, filmName: Nombre,rotationType:Rotation , region: Region,lenghtMinutes:Minutes, videoFormat: Format
    };
};

const gestorDeErrores = (err: any, req: Request, res: Response, next: NextFunction) =>
{
    console.error("Error en applicacion: ", err.message);
    res.status(500).json({error: "Error interno del servidor", detail: err.message});
};

const testApi = (async () =>
{
    await new Promise(resolve => setTimeout(resolve, 1000)); //
    console.log("Han pasado 1 segundos desde que el servidor se inició");

    // 1-2. Obtener la lista de discos
    console.log("\n 1-2. Discos en memoria:");
    const Disco = (await axios.get("http://localhost:3000/Discos")).data;
    console.log(Disco, "\n");


    // 3-5. Crear un nuevo disco

    console.log(" 3-5. Creación de Romantic movie yes ");
    try
    {
        const eq = await axios.post("http://localhost:3000/Discos/", {
            "filmName": "Romantic Movie Yes",
            "rotationType": "CAV",
            "region": "BollyWood",
            "lenghtMinutes":200,
            "videoFormat":"NTSC"
        });
        console.log(" Respuesta de la insercción:", eq.data, "\n");
    }
    catch (error: any)
    {
        console.log(" Error en la insercción:", error.response.data);
    }

    console.log(" 6-7. Discos en memoria tras la insercción:");
    const Discos2 = (await axios.get("http://localhost:3000/Discos/")).data;
    console.log( Discos2, "\n");


    // 6 -7. Eliminar el Disco recién creado (ID 3)

    console.log(" Eliminación del Disco con ID 2");
    try
    {
        const respuesta = await axios.delete("http://localhost:3000/Discos/2");
        console.log(" Respuesta de la eliminación:", respuesta.data, "\n");
    }
    catch (error: any)
    {
        console.log(" Error en la eliminación:", error.response.data);
    }


    console.log("Disco en memoria tras la eliminación:");
    const Disco3 = (await axios.get("http://localhost:3000/Discos")).data;
    console.log(Disco3, "\n");

    // 8-9. Actualizar un Disco existente (por ejemplo ID 1)
    console.log(" 8-9. Actualización del Disco con ID 1");
    try {
        const updateResponse = await axios.put("http://localhost:3000/Discos/1", {
            filmName: "Car movie UPDATED yes",
            rotationType: "CAV",
            region: "UpdatedRegion",
            lenghtMinutes: 150,
            videoFormat: "PAL"
        });
        console.log(" Respuesta de la actualización:", updateResponse.data, "\n");
    } catch (error: any) {
        console.log(" Error en la actualización:", error.response?.data || error.message);
    }



    console.log("Tests de la API finalizados.");

});

/// -**-**- RUTAS -**-**-

app.get("/", (req: Request, res: Response) =>
{
    res.send("¡Bienvenido a la API de Discos yes!");
});


app.get('/Discos', (req: Request, res: Response) =>
{
    res.json(Discos); //devuelve la lista de Discos en formato JSON de la «base de datos» (que es un array en memoria en este caso)
});


app.get('/Discos/:id', (req: Request, res: Response) =>
{
    const {id} = req.params; // No se puede usar parseInt directamente en ID porque es de tipo string
    const numeroId = Number(id);//Pases minusclas a  numero minusculo
    if (isNaN(numeroId))//Not a number
    {
        return res.status(400).json({error: "ID inválido"});
    }

    const Disco = Discos.find((e) => e.id === numeroId);
    if (!Disco){
        res.status(404).json({error: "Disco no encontrado"});

    }
    else{
        return Disco;
    }

});

app.post('/Discos', (req: Request, res: Response) =>
{
    try
    {
        const error = validarDisco(req.body);
        if (error)
        {
            return res.status(400).json({error});
        }
        const nuevoDisco = extraerDisco(req.body);
        Discos.push(nuevoDisco);
        res.status(201).json(nuevoDisco);
    }
    catch (err: any)
    {
        res.status(500).json({error: err.message});
    }
});

app.delete('/Discos/:id', (req: Request, res: Response) =>
{
    try
    {
        const {id} = req.params;
        const numeroId = Number(id);
        if (isNaN(numeroId))
        {
            return res.status(400).json({error: "ID inválido"});
        }

        if (!Discos.some((e) => e.id === numeroId))
        {
            return res.status(404).json({error: "No existe un Disco con ese ID"});
        }

        Discos = Discos.filter((e) => e.id !== numeroId);

        res.json({message: "Disco eliminado correctamente"});
    }
    catch (err: any)
    {
        res.status(500).json({error: "Error all llevar a cabo la eliminación", detail: err.message});
    }
});

app.put("/Discos/:id", (req: Request, res: Response) => {
    try {
        const numeroId = Number(req.params.id);
        if (isNaN(numeroId)) return res.status(400).json({ error: "ID inválido" });

        const index = Discos.findIndex(d => d.id === numeroId);
        if (index === -1) return res.status(404).json({ error: "Disco no encontrado" });

        // Validate only what was sent
        const error = validarDisco(req.body, true);
        if (error) return res.status(400).json({ error });

        // Do not allow changing id
        const { id, ...body } = req.body;

        // Only allow known keys
        const allowedKeys: (keyof LD)[] = ["filmName", "rotationType", "region", "lenghtMinutes", "videoFormat"];
        const patch: Partial<LD> = {};
        for (const k of allowedKeys) {
            if (body[k] !== undefined) (patch as any)[k] = body[k];
        }

        Discos[index] = { ...Discos[index], ...patch };

        res.json({ message: "Disco cambiado correctamente", disco: Discos[index] });
    } catch (err: any) {
        res.status(500).json({ error: "Error al actualizar el Disco", detail: err.message });
    }
});

app.use((req: Request, res: Response) =>
{
    res.status(404).json({error: "Ruta no encontrada"});
});

app.use(gestorDeErrores);


app.listen(3000, () => console.log("Servidor en http://localhost:3000"));

await testApi();