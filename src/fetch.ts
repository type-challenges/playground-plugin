const apiSite = "https://tsch.js.org";

export async function fetchQuestions(locale: string) {
  const questionsREADME = await fetch(`${apiSite}/raw/${locale || "en"}`).then(
    (r) => r.text()
  );

  return (
    `<img src="${apiSite}/logo.svg" />` +
    questionsREADME.replace(
      /(<img[^>]+src=['"])([^'"]+)([^>]+>)/g,
      (_match, prefix, imgUrl, suffix) => {
        const currentUrl =
          "https://github.com/type-challenges/type-challenges/blob/master/README.md";
        const absoluteUrl = new URL(imgUrl, currentUrl);

        if (new URL(currentUrl).origin === absoluteUrl.origin) {
          return "";
        } else {
          return prefix + imgUrl + suffix;
        }
      }
    )
  );
}

export async function fetchQuestion(quiz: number, locale: string) {
  const questionReadMe = await fetch(`${apiSite}/${quiz}/raw/${locale}`).then(
    (r) => r.text()
  );

  const playUrl = questionReadMe.match(
    /<a[^>]+href=['"](https:\/\/tsch\.js\.org\/\d+\/play[^'"]*)/
  )?.[1];

  return {
    readme: questionReadMe
      .replace(/<!--info-footer-start-->.*<!--info-footer-end-->/, "")
      .replace(/<h1>/, "<h2>")
      .replace(/<\/h1>/, "</h2>")
      .replace(
        /<a[^>]+href=['"](https:\/\/tsch\.js\.org\/\d+\/play[^<]+<img[^<>]+><\/a>(&nbsp;|\t|\s)+)/,
        ""
      ),
    playUrl,
  };
}
