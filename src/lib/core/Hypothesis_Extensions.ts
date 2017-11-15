export function getText( hypothesis: IHypothesis ): string {
    return hypothesis.elements.map( element => element.text ).join( " " ).trim().toLowerCase();
}