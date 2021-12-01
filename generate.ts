import sharp from "sharp";
import SkyFiles from "skyfiles";
import SkyUtil from "skyutil";
import parts from "./parts.json";
import results from "./results.json";

const COUNT = 9000;

const generate = async () => {

    const id = (results as any).length;

    const result: any = {
        attributes: [],
    };

    const imageParts: any[] = [];

    for (const [traitId, trait] of parts.entries()) {

        let totalPercent = 0;
        let percentCount = 0;
        for (const part of trait.parts) {
            if ((part as any).percent !== undefined) {
                totalPercent += (part as any).percent;
                percentCount += 1;
            }
        }
        const basePercent = (100 - totalPercent) / (trait.parts.length - percentCount);

        let rand = Math.random() * 100;
        for (const [partId, part] of trait.parts.entries()) {
            rand -= (part as any).percent === undefined ? basePercent : (part as any).percent;
            if (rand <= 0) {
                result.attributes.push({ trait_type: trait.name, value: part.name });
                imageParts.push({ traitId, partId });
                break;
            }
        }
    }

    // check duplicated
    if ((results as any).find((r: any) => JSON.stringify(r.attributes) === JSON.stringify(result.attributes)) !== undefined) {
        // retry.
        await generate();
    }

    else {
        (results as any).push(result);

        let images: any[] = [];
        for (const imagePart of imageParts) {
            images = images.concat(parts[imagePart.traitId].parts[imagePart.partId].images);
        }
        images.sort((a, b) => a.order - b.order);

        const parameters: any[] = [];
        for (const image of images) {
            if (image !== undefined) {
                parameters.push({ input: image.path });
            }
        }

        await sharp("parts/bg.png")
            .composite(parameters)
            .jpeg({ quality: 90 })
            .toFile(`results/${id}.jpg`);

        console.log(`#${id} generated.`);
    }
};

(async () => {
    await SkyUtil.repeatResultAsync(COUNT, async () => await generate());
    await SkyFiles.write("results.json", JSON.stringify(results));
})();
