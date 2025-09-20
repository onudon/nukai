from flask import Flask, request, jsonify
import requests
from bs4 import BeautifulSoup
import requests
from bs4 import BeautifulSoup
from bs4 import Tag
import re as are
import json
import codecs

primary_url = "https://syllabus-view.kwansei.ac.jp/main/web/course/list/"
regex = r"[  *]"

def scrape_senri(insertCookie):
    cookie = {}
    cookie["main/OPENSYLLABUS"] = insertCookie
    re = requests.get(primary_url, cookies=cookie, verify=False)
    re.encoding = re.apparent_encoding

    soup = BeautifulSoup(re.text, "html.parser")

    dic = {}
    clazzlist = []
    # minclazz = None
    # min = 1000000
    for td in soup.find_all("td", class_="left"):
        name = td.contents[1].getText().strip()
        timetable = td.next_sibling.next_sibling.getText()
        section = td.next_sibling.next_sibling.next_sibling.next_sibling.getText()
        days = td.next_sibling.next_sibling.next_sibling.next_sibling.next_sibling.next_sibling.getText()
        registed_max = td.next_sibling.next_sibling.next_sibling.next_sibling.next_sibling.next_sibling.next_sibling.next_sibling.getText()
        id = td.next_sibling.next_sibling.next_sibling.next_sibling.next_sibling.next_sibling.next_sibling.next_sibling.next_sibling.next_sibling.contents[0]["href"][29:34]
        
        clazz = Clazz(name.replace(" ", ""), timetable.replace(" ", ""), section.replace(" ", ""), days.replace(" ", ""), 
                      registed_max.replace("\n", "").replace(" ", "").replace(" ", ""), id)
        
        # print(id + " | " + str(min))

        # if int(id) < int(min):
        #     min = id
        #     minclazz = clazz 
        clazzlist.append(clazz)
        dic[id] = clazz.__dict__

    return dic

class Clazz():
    def __init__(self, name, timetable, section, days, registed_max, id):
        self.name = name
        self.timetable = timetable
        self.section = section
        self.days = days
        self.registed_max = registed_max
        self.id = id

    def __repr__(self):
        return "name: " + self.name + " | timetable: " + self.timetable + " | section: " + self.section + " | days: " + self.days + " | registed_max: " + self.registed_max + " | id: " + self.id

app = Flask(__name__)

@app.route('/scrape', methods=['GET'])
def scrape():
    cookie = request.args.get('cookie')
    data = scrape_senri(cookie)
    return jsonify(data)

if __name__ == '__main__':
    app.run(debug=True)