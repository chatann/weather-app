import requests


def download_image(url, file_path):
    r = requests.get(url, stream=True)

    if r.status_code == 200:
        with open(file_path, "wb") as f:
            f.write(r.content)


# for i in range(0, 9):
#     for j in range(0, 16):
#         if j < 10:
#             j = "0" + str(j)
#         numstr = str(i) + str(j)
#         url = "https://www.jma.go.jp/bosai/forecast/img/{}.svg".format(numstr)
#         file_path = "./img/{}.svg".format(numstr)
#         download_image(url, file_path)

numstr = "103"
url = "https://www.jma.go.jp/bosai/forecast/img/{}.svg".format(numstr)
file_path = "./img/{}.svg".format(numstr)
download_image(url, file_path)